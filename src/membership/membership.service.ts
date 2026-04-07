import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Gender, EducationLevel, EmploymentStatus } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { MailService } from '../config/mail.service';
import { AuthService } from '../auth/auth.service';
import { SubmitMembershipDto } from './dto/submit-membership.dto';
import { ReviewMembershipDto } from './dto/review-membership.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private authService: AuthService,
  ) {}

  /**
   * Lister les demandes d'adhésion (admin)
   */
  async listMemberships(params: {
    status?: 'pending' | 'approved' | 'rejected' | 'suspended';
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const status = params.status;
    const search = params.search?.trim();

    const where: Prisma.MembershipWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { membershipNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.membership.count({ where }),
      this.prisma.membership.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          membershipNumber: true,
          membershipType: true,
          reviewedBy: {
            select: { id: true, email: true, username: true },
          },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Soumettre une demande d'adhésion (public)
   */
  async submitApplication(dto: SubmitMembershipDto) {
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException('Les codes ne correspondent pas');
    }

    // Valider les consentements
    if (
      !dto.consents.agreesToStatutes ||
      !dto.consents.agreesToPrivacyPolicy ||
      !dto.consents.agreesToCodeOfConduct
    ) {
      throw new BadRequestException(
        'Vous devez accepter tous les consentements',
      );
    }

    const gender = this.mapGender(dto.identity.gender);
    const educationLevel = this.mapEducationLevel(
      dto.background?.educationLevel,
    );
    const currentEmploymentStatus = this.mapEmploymentStatus(
      dto.background?.currentEmploymentStatus,
    );

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const { membership, user } = await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: dto.identity.email },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictException('Un compte existe déjà avec cet email');
      }

      const existingRequest = await tx.membership.findFirst({
        where: {
          email: dto.identity.email,
          status: { in: ['pending', 'approved'] },
        },
        select: { id: true },
      });

      if (existingRequest) {
        throw new BadRequestException(
          'Une demande est déjà en cours pour cet email',
        );
      }

      let user: { id: string; email: string; username: string | null; role: any };
      try {
        user = await tx.user.create({
          data: {
            email: dto.identity.email,
            password: hashedPassword,
            role: 'applicant',
            accountStatus: 'active',
          },
          select: { id: true, email: true, username: true, role: true },
        });
      } catch (error) {
        if ((error as any)?.code === 'P2002') {
          const target = (error as any)?.meta?.target as string[] | undefined;
          if (target?.includes('email')) {
            throw new ConflictException('Un compte existe déjà avec cet email');
          }
          throw new ConflictException('Conflit de contrainte unique');
        }
        throw error;
      }

      const membership = await tx.membership.create({
        data: {
          firstName: dto.identity.firstName,
          lastName: dto.identity.lastName,
          email: dto.identity.email,
          phone: dto.identity.phone,
          dateOfBirth: new Date(dto.identity.dateOfBirth),
          gender,
          nationality: dto.identity.nationality,
          address: dto.address as unknown as Prisma.InputJsonValue,
          profile: dto.profile as unknown as Prisma.InputJsonValue,
          profession: dto.background?.profession,
          educationLevel,
          currentEmploymentStatus,
          motivationLetter: dto.motivation.motivationLetter,
          skills: dto.motivation.skills || [],
          availability: dto.availability.type,
          hoursPerWeek: dto.availability.hoursPerWeek,
          hasVolunteeredBefore: dto.background?.hasVolunteeredBefore || false,
          previousExperience: dto.background?.previousExperience,
          agreesToStatutes: dto.consents.agreesToStatutes,
          agreesToPrivacyPolicy: dto.consents.agreesToPrivacyPolicy,
          agreesToCodeOfConduct: dto.consents.agreesToCodeOfConduct,
          status: 'pending',
          userId: user.id,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

      return { membership, user };
    });

    // Envoyer email de confirmation
    this.mailService
      .sendMembershipConfirmation(dto.identity.email, dto.identity.firstName)
      .catch(() => undefined);

    const { accessToken, refreshToken } = await this.authService.issueTokens(user);

    return {
      message:
        'Votre demande a bien été reçue. Nous vous répondrons dans les meilleurs délais.',
      id: membership.id,
      accessToken,
      refreshToken,
      user,
      membership,
    };
  }

  private mapGender(value?: string): Gender | undefined {
    if (!value) return undefined;
    const v = value.trim().toLowerCase();
    if (v === 'm') return Gender.homme;
    if (v === 'f') return Gender.femme;
    if (v === 'homme') return Gender.homme;
    if (v === 'femme') return Gender.femme;
    if (v === 'non_binaire') return Gender.non_binaire;
    if (v === 'prefere_ne_pas_dire') return Gender.prefere_ne_pas_dire;
    return undefined;
  }

  private mapEducationLevel(value?: string): EducationLevel | undefined {
    if (!value) return undefined;
    const v = value.trim().toLowerCase();
    if (['master', 'msc', 'm2', 'bac+5', 'bac +5', 'bac_plus_5'].includes(v)) {
      return EducationLevel.bac_plus_5;
    }
    if (['licence', 'bachelor', 'l3', 'bac+3', 'bac +3', 'bac_plus_3'].includes(v)) {
      return EducationLevel.bac_plus_3;
    }
    if (['bts', 'dut', 'bac+2', 'bac +2', 'bac_plus_2'].includes(v)) {
      return EducationLevel.bac_plus_2;
    }
    if (['bac', 'baccalaureat', 'baccalauréat'].includes(v)) {
      return EducationLevel.bac;
    }
    if (['doctorat', 'phd'].includes(v)) {
      return EducationLevel.doctorat;
    }
    if (['college', 'collège'].includes(v)) {
      return EducationLevel.college;
    }
    if (['lycee', 'lycée'].includes(v)) {
      return EducationLevel.lycee;
    }
    return EducationLevel.autre;
  }

  private mapEmploymentStatus(value?: string): EmploymentStatus | undefined {
    if (!value) return undefined;
    const v = value.trim().toLowerCase();
    if (['employed', 'employee', 'salarié', 'salarie', 'employe'].includes(v)) {
      return EmploymentStatus.employe;
    }
    if (['student', 'etudiant', 'étudiant'].includes(v)) {
      return EmploymentStatus.etudiant;
    }
    if (['selfemployed', 'self-employed', 'freelance', 'independant', 'indépendant'].includes(v)) {
      return EmploymentStatus.independant;
    }
    if (['unemployed', 'demandeur_emploi', 'demandeur d’emploi', 'demandeur emploi'].includes(v)) {
      return EmploymentStatus.demandeur_emploi;
    }
    if (['retired', 'retraite', 'retraité'].includes(v)) {
      return EmploymentStatus.retraite;
    }
    return EmploymentStatus.autre;
  }

  /**
   * Récupérer une demande d'adhésion par ID
   */
  async findById(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, accountStatus: true, email: true },
        },
        reviewedBy: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Demande non trouvée');
    }

    return membership;
  }

  /**
   * Approuver une adhésion (admin)
   */
  async approveMembership(
    id: string,
    reviewerId: string,
    dto: ReviewMembershipDto,
  ) {
    const { membershipNumber, email, firstName, lastName } = await this.prisma.$transaction(
      async (tx) => {
        const membership = await tx.membership.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            email: true,
            firstName: true,
            lastName: true,
            userId: true,
          },
        });

        if (!membership) {
          throw new NotFoundException('Demande non trouvée');
        }

        if (membership.status !== 'pending') {
          throw new BadRequestException('Cette demande ne peut pas être approuvée');
        }

        if (!membership.userId) {
          throw new BadRequestException('Aucun compte n’est lié à cette demande');
        }

        // Générer le numéro d'adhésion
        const year = new Date().getFullYear();
        const count = await tx.membership.count({
          where: {
            status: 'approved',
            membershipStartDate: {
              gte: new Date(`${year}-01-01`),
            },
          },
        });

        const membershipNumber = `CI-${year}-${String(count + 1).padStart(5, '0')}`;

        try {
          await tx.user.update({
            where: { id: membership.userId },
            data: {
              role: 'member',
              username: membershipNumber,
              accountStatus: 'active',
            },
          });
        } catch (error) {
          if ((error as any)?.code === 'P2002') {
            const target = (error as any)?.meta?.target as string[] | undefined;
            if (target?.includes('username')) {
              throw new ConflictException('Username déjà utilisé, réessayez');
            }
            throw new ConflictException('Conflit de contrainte unique');
          }
          throw error;
        }

        await tx.membership.update({
          where: { id },
          data: {
            status: 'approved',
            membershipNumber,
            membershipType: dto.membershipType || 'actif',
            membershipStartDate: new Date(),
            membershipEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
            reviewedById: reviewerId,
            reviewedAt: new Date(),
            internalNotes: dto.internalNotes,
          },
        });

        return {
          membershipNumber,
          email: membership.email,
          firstName: membership.firstName,
          lastName: membership.lastName,
        };
      },
    );

    await this.mailService.sendMembershipApproved(
      email,
      firstName,
      lastName,
      membershipNumber,
    );

    return {
      message: 'Adhésion validée avec succès',
      membershipNumber,
    };
  }

  /**
   * Rejeter une adhésion (admin)
   */
  async rejectMembership(
    id: string,
    reviewerId: string,
    dto: ReviewMembershipDto,
  ) {
    const membership = await this.findById(id);

    if (membership.status !== 'pending') {
      throw new BadRequestException('Cette demande ne peut pas être rejetée');
    }

    if (!dto.rejectionReason) {
      throw new BadRequestException(
        'Une raison de refus est obligatoire',
      );
    }

    // Mettre à jour la demande
    await this.prisma.membership.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: dto.rejectionReason,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        internalNotes: dto.internalNotes,
      },
    });

    // Envoyer email de refus
    await this.mailService.sendMembershipRejected(
      membership.email,
      membership.firstName,
      dto.rejectionReason,
    );

    return { message: 'Demande refusée' };
  }

  /**
   * Obtenir les statistiques des adhésions (admin)
   */
  async getStats() {
    const [total, pending, approved, rejected, suspended, thisMonth] =
      await this.prisma.$transaction([
        this.prisma.membership.count(),
        this.prisma.membership.count({ where: { status: 'pending' } }),
        this.prisma.membership.count({ where: { status: 'approved' } }),
        this.prisma.membership.count({ where: { status: 'rejected' } }),
        this.prisma.membership.count({ where: { status: 'suspended' } }),
        this.prisma.membership.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    return {
      total,
      pending,
      approved,
      rejected,
      suspended,
      thisMonth,
    };
  }
}
