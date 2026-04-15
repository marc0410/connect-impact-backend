import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../config/prisma.service';
import { MailService } from '../config/mail.service';
import { Prisma } from '@prisma/client';
import {
  LoginDto,
  CreateStaffAccountDto,
  ActivateAccountDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './dto/create-auth.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  // ═══════════════════════════════════════════════
  // 1. LOGIN
  // ═══════════════════════════════════════════════
  async login(dto: LoginDto) {
    // Cherche par email OU username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { username: dto.identifier },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifie que le compte est actif
    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Compte inactif ou suspendu');
    }

    // Vérifie le mot de passe
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  // ═══════════════════════════════════════════════
  // 2. CREATE MEMBER ACCOUNT (interne)
  // ═══════════════════════════════════════════════
  async createMemberAccount(data: {
    email: string;
    username: string;
    membershipId: string;
  }) {
    // Génère un mot de passe à 6 chiffres
    const plainPassword = this.generateSixDigitPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: 'member',
        accountStatus: 'active',
      },
    });

    return { user, plainPassword };
  }

  // ═══════════════════════════════════════════════
  // 3. CREATE STAFF ACCOUNT (admin only)
  // ═══════════════════════════════════════════════
  async createStaffAccount(creatorId: string, dto: CreateStaffAccountDto) {
    // Vérifie que l'email n'existe pas
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Vérifie que le username n'existe pas
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already in use');
    }

    // Génère un token d'invitation
    const plainToken = uuidv4();
    const hashedToken = await bcrypt.hash(plainToken, 10);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    try {
      await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          password: 'temp', // Placeholder, sera remplacé à l'activation
          role: dto.role as any,
          accountStatus: 'pending_invitation',
          invitationToken: hashedToken,
          invitationTokenExpiresAt: expiresAt,
          createdById: creatorId,
        },
      });
    } catch (error) {
      const isKnownPrismaError =
        error instanceof Prisma.PrismaClientKnownRequestError ||
        typeof (error as any)?.code === 'string';

      if (isKnownPrismaError && (error as any).code === 'P2002') {
        const target = (error as any)?.meta?.target as string[] | undefined;
        if (target?.includes('email')) {
          throw new ConflictException('Email already in use');
        }
        if (target?.includes('username')) {
          throw new ConflictException('Username already in use');
        }
        throw new ConflictException('Unique constraint failed');
      }

      throw error;
    }

    // Envoie email d'invitation
    await this.mailService.sendInvitation(
      dto.email,
      dto.firstName,
      dto.role,
      plainToken,
    );

    return { message: 'Invitation envoyée' };
  }

  // ═══════════════════════════════════════════════
  // 4. ACTIVATE ACCOUNT
  // ═══════════════════════════════════════════════
  async activateAccount(dto: ActivateAccountDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Vérifie le token et l'expiration
    if (!user.invitationToken || !user.invitationTokenExpiresAt) {
      throw new BadRequestException('No invitation token found');
    }

    const [isTokenValid, hashedPassword] = await Promise.all([
      bcrypt.compare(dto.token, user.invitationToken),
      bcrypt.hash(dto.password, 10),
    ]);

    if (!isTokenValid) {
      throw new BadRequestException('Invalid invitation token');
    }

    if (new Date() > user.invitationTokenExpiresAt) {
      throw new BadRequestException('Invitation token has expired');
    }

    // Met à jour l'utilisateur
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        accountStatus: 'active',
        invitationToken: null,
        invitationTokenExpiresAt: null,
        isFirstLogin: true,
      },
    });

    // Envoie email de confirmation en arrière-plan (non-bloquant)
    this.mailService
      .sendAccountActivated(updatedUser.email, user.username || 'User')
      .catch((err) =>
        this.logger.error('Failed to send account activated email', err),
      );

    const { accessToken, refreshToken } = await this.issueTokens(updatedUser);

    return {
      message: 'Compte activé avec succès',
      accessToken,
      refreshToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    };
  }

  // ═══════════════════════════════════════════════
  // 5. REFRESH ACCESS TOKEN
  // ═══════════════════════════════════════════════
  async refreshAccessToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Vérifie le refreshToken haché en BDD
      if (!user.refreshToken) {
        throw new UnauthorizedException('No refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        dto.refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const { accessToken } = this.generateTokens(user);

      return {
        accessToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ═══════════════════════════════════════════════
  // 6. LOGOUT
  // ═══════════════════════════════════════════════
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out' };
  }

  // ═══════════════════════════════════════════════
  // 7. CHANGE PASSWORD
  // ═══════════════════════════════════════════════
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed' };
  }

  // ═══════════════════════════════════════════════
  // 8. VALIDATE USER (pour LocalStrategy)
  // ═══════════════════════════════════════════════
  async validateUser(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // ═══════════════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════════════

  async getMe(userId: string, include?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        accountStatus: true,
        isFirstLogin: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const includes = (include || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    if (includes.includes('membership') || includes.includes('membershipSummary')) {
      const membership = await this.prisma.membership.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          nationality: true,
          address: true,
          availability: true,
          hoursPerWeek: true,
          motivationLetter: true,
          skills: true,
          profession: true,
          educationLevel: true,
          currentEmploymentStatus: true,
          status: true,
          membershipNumber: true,
          membershipType: true,
          createdAt: true,
          reviewedAt: true,
        },
      });

      return { ...user, membership };
    }

    return user;
  }

  async issueTokens(user: { id: string; email: string; username?: string | null; role: any }) {
    const { accessToken, refreshToken } = this.generateTokens(user);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken: hashedRefreshToken,
      },
    });

    return { accessToken, refreshToken };
  }

  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private generateSixDigitPassword(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
