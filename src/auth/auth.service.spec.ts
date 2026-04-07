import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../config/mail.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  const mockMailService = {
    sendInvitation: jest.fn(),
    sendAccountActivated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStaffAccount', () => {
    const dto = {
      email: 'staff@example.com',
      username: 'staff1',
      role: 'admin' as const,
      firstName: 'Staff',
      lastName: 'User',
    };

    it('throws if username already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 'u1' }); // username check

      await expect(service.createStaffAccount('creator', dto as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockMailService.sendInvitation).not.toHaveBeenCalled();
    });

    it('maps prisma P2002(username) to ConflictException', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check

      mockPrismaService.user.create.mockRejectedValueOnce({
        code: 'P2002',
        meta: { target: ['username'] },
      });

      await expect(service.createStaffAccount('creator', dto as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockMailService.sendInvitation).not.toHaveBeenCalled();
    });
  });
});
