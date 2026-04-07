import { Injectable, NotImplementedException, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../config/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  create(createProfileDto: CreateProfileDto) {
    throw new NotImplementedException('Profile creation not implemented yet');
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        accountStatus: true,
        role: true,
        createdAt: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.username || user.email,
      email: user.email,
      status: user.accountStatus,
      createdAt: user.createdAt,
      user,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        accountStatus: true,
        isFirstLogin: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  update(id: string, updateProfileDto: UpdateProfileDto) {
    throw new NotImplementedException('Profile update not implemented yet');
  }

  remove(id: string) {
    throw new NotImplementedException('Profile delete not implemented yet');
  }
}
