import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../config/prisma.service';

const mockPrisma = {
  event: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eventSpeaker: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  eventRegistration: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  eventSave: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  eventLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    const mockEvent = {
      id: 'evt-1',
      type: 'webinaire',
      title: 'Webinaire test',
      slug: 'webinaire-test',
      description: 'Un webinaire',
      startAt: new Date('2026-04-22T18:00:00Z'),
      endAt: new Date('2026-04-22T19:30:00Z'),
      timezone: 'Europe/Paris',
      meetingUrl: 'https://meet.google.com/xxx',
      capacity: 300,
      registeredCount: 50,
      domain: 'Tech',
      tags: ['Gratuit'],
      language: 'FR',
      featured: true,
      status: 'upcoming',
      viewsCount: 100,
      savesCount: 20,
      likesCount: 10,
      publishedAt: new Date(),
      organizer: { id: 'user-1', username: 'admin', memberProfile: null },
      speakers: [{ id: 'sp-1', name: 'Amara', role: 'DRH', avatarUrl: null, linkedinUrl: null, order: 1 }],
    };

    it('should return paginated events', async () => {
      mockPrisma.event.count.mockResolvedValue(1);
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll({ page: 1, perPage: 12 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].title).toBe('Webinaire test');
      expect(result.data[0].speakers).toHaveLength(1);
    });

    it('should hide draft and cancelled events for non-admins', async () => {
      mockPrisma.event.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);

      await service.findAll({}, false);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['upcoming', 'ongoing', 'completed'] },
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrisma.event.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);

      await service.findAll({ type: 'webinaire' }, true);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'webinaire' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.event.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);

      await service.findAll({ from: '2026-04-15', to: '2026-05-15' }, true);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startAt: { gte: new Date('2026-04-15') },
            endAt: { lte: new Date('2026-05-15') },
          }),
        }),
      );
    });

    it('should handle full-text search on title and description', async () => {
      mockPrisma.event.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);

      await service.findAll({ q: 'financement' }, true);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'financement', mode: 'insensitive' } },
              { description: { contains: 'financement', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should throw NotFoundException for non-existing event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should increment view count', async () => {
      const mockEvent = {
        id: 'evt-1',
        type: 'webinaire',
        title: 'Test',
        slug: 'test',
        status: 'upcoming',
        viewsCount: 10,
        organizer: { id: 'u-1', username: 'admin', memberProfile: null },
        speakers: [],
      };
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.event.update.mockResolvedValue({});

      await service.findOne('evt-1');

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { viewsCount: { increment: 1 } },
      });
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          { type: 'webinaire', title: 'Test', description: 'desc', startAt: '2026-04-22T18:00:00Z', endAt: '2026-04-22T19:30:00Z', meetingUrl: 'https://meet.google.com/xxx' } as any,
          'org-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create event with speakers', async () => {
      mockPrisma.event.findUnique
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValue({
          id: 'evt-new',
          type: 'webinaire',
          title: 'Mon Webinaire',
          slug: 'mon-webinaire',
          status: 'draft',
          viewsCount: 0,
          organizer: { id: 'u-1', username: 'admin', memberProfile: null },
          speakers: [{ id: 'sp-1', name: 'Fatou', role: 'Speaker', order: 1 }],
        });
      mockPrisma.event.create.mockResolvedValue({ id: 'evt-new' });
      mockPrisma.eventSpeaker.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.event.update.mockResolvedValue({});

      await service.create(
        {
          type: 'webinaire' as any,
          title: 'Mon Webinaire',
          description: 'desc',
          startAt: '2026-04-22T18:00:00Z',
          endAt: '2026-04-22T19:30:00Z',
          meetingUrl: 'https://meet.google.com/xxx',
          speakers: [{ name: 'Fatou', role: 'Speaker', order: 1 }],
        } as any,
        'org-id',
      );

      expect(mockPrisma.eventSpeaker.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ eventId: 'evt-new', name: 'Fatou', role: 'Speaker', order: 1 })],
      });
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException for non-existing event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existing', {})).rejects.toThrow(NotFoundException);
    });

    it('should replace speakers when provided', async () => {
      mockPrisma.event.findUnique
        .mockResolvedValueOnce({ id: 'evt-1', slug: 'test' })
        .mockResolvedValue({
          id: 'evt-1',
          type: 'webinaire',
          title: 'Updated',
          slug: 'test',
          status: 'upcoming',
          viewsCount: 0,
          organizer: { id: 'u-1', username: 'admin', memberProfile: null },
          speakers: [],
        });
      mockPrisma.event.update.mockResolvedValue({});
      mockPrisma.eventSpeaker.deleteMany.mockResolvedValue({});
      mockPrisma.eventSpeaker.createMany.mockResolvedValue({ count: 2 });

      await service.update('evt-1', {
        speakers: [
          { name: 'Speaker A', order: 1 },
          { name: 'Speaker B', order: 2 },
        ],
      } as any);

      expect(mockPrisma.eventSpeaker.deleteMany).toHaveBeenCalledWith({ where: { eventId: 'evt-1' } });
      expect(mockPrisma.eventSpeaker.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Speaker A', order: 1 }),
          expect.objectContaining({ name: 'Speaker B', order: 2 }),
        ]),
      });
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException for non-existing event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should delete event and return registrations count', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        _count: { registrations: 50 },
      });
      mockPrisma.event.delete.mockResolvedValue({});

      const result = await service.remove('evt-1');

      expect(result.deleted.eventId).toBe('evt-1');
      expect(result.deleted.registrationsDeleted).toBe(50);
    });
  });

  // ── Registrations ────────────────────────────────────────────────────────────

  describe('registerForEvent', () => {
    it('should throw NotFoundException for non-existing event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.registerForEvent('non-existing', { firstName: 'Jean', lastName: 'Dupont', email: 'j@e.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when event is full', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        capacity: 100,
        registeredCount: 100,
      });

      await expect(
        service.registerForEvent('evt-1', { firstName: 'Jean', lastName: 'Dupont', email: 'j@e.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register successfully and increment count', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        capacity: 100,
        registeredCount: 50,
      });
      mockPrisma.eventRegistration.create.mockResolvedValue({
        id: 'reg-1',
        email: 'jean@example.com',
      });
      mockPrisma.event.update.mockResolvedValue({});

      const result = await service.registerForEvent('evt-1', {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com',
      });

      expect(result.registrationId).toBe('reg-1');
      expect(result.status).toBe('confirmed');
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { registeredCount: { increment: 1 } },
      });
    });

    it('should fetch user email when authenticated without email', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        capacity: null,
        registeredCount: 0,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'user@connectimpact.org' });
      mockPrisma.eventRegistration.create.mockResolvedValue({
        id: 'reg-2',
        email: 'user@connectimpact.org',
      });
      mockPrisma.event.update.mockResolvedValue({});

      const result = await service.registerForEvent(
        'evt-1',
        { firstName: 'Kofi', lastName: 'Mensah' },
        'user-id',
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        select: { email: true },
      });
      expect(result.status).toBe('confirmed');
    });

    it('should throw BadRequestException when no email at all', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        capacity: null,
        registeredCount: 0,
      });

      await expect(
        service.registerForEvent('evt-1', { firstName: 'Jean', lastName: 'Dupont' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unregisterFromEvent', () => {
    it('should cancel registration and decrement count', async () => {
      mockPrisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'reg-1',
        eventId: 'evt-1',
      });
      mockPrisma.eventRegistration.update.mockResolvedValue({});
      mockPrisma.event.update.mockResolvedValue({});

      const result = await service.unregisterFromEvent('evt-1', 'reg-1');

      expect(result.cancelled).toBe(true);
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { registeredCount: { decrement: 1 } },
      });
    });

    it('should throw NotFoundException for wrong event', async () => {
      mockPrisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'reg-1',
        eventId: 'other-event',
      });

      await expect(service.unregisterFromEvent('evt-1', 'reg-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAttendance', () => {
    it('should mark attendance for multiple registrations', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ id: 'evt-1' });
      mockPrisma.eventRegistration.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.updateAttendance('evt-1', {
        registrationIds: ['r1', 'r2', 'r3'],
        attended: true,
      });

      expect(result.updated).toBe(3);
      expect(result.message).toContain('3 participants');
    });
  });

  // ── Engagement ───────────────────────────────────────────────────────────────

  describe('toggleSave', () => {
    it('should create save when not already saved', async () => {
      mockPrisma.event.findUnique
        .mockResolvedValueOnce({ id: 'evt-1' })
        .mockResolvedValue({ savesCount: 1 });
      mockPrisma.eventSave.findUnique.mockResolvedValue(null);
      mockPrisma.eventSave.create.mockResolvedValue({});
      mockPrisma.event.update.mockResolvedValue({});

      const result = await service.toggleSave('evt-1', 'user-1');

      expect(result.saved).toBe(true);
      expect(result.savesCount).toBe(1);
    });

    it('should remove save when already saved', async () => {
      mockPrisma.event.findUnique
        .mockResolvedValueOnce({ id: 'evt-1' })
        .mockResolvedValue({ savesCount: 0 });
      mockPrisma.eventSave.findUnique.mockResolvedValue({ id: 'save-1' });
      mockPrisma.eventSave.delete.mockResolvedValue({});
      mockPrisma.event.update.mockResolvedValue({});

      const result = await service.toggleSave('evt-1', 'user-1');

      expect(result.saved).toBe(false);
    });
  });

  describe('toggleLike', () => {
    it('should toggle like on event', async () => {
      mockPrisma.event.findUnique
        .mockResolvedValueOnce({ id: 'evt-1' })
        .mockResolvedValue({ likesCount: 1 });
      mockPrisma.eventLike.findUnique.mockResolvedValue(null);
      mockPrisma.eventLike.create.mockResolvedValue({});
      mockPrisma.event.update.mockResolvedValue({});

      const result = await service.toggleLike('evt-1', 'user-1');

      expect(result.liked).toBe(true);
    });
  });

  // ── Statistics ───────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return full event statistics', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        viewsCount: 450,
        savesCount: 87,
        likesCount: 142,
        registrations: [
          { attendanceConfirmed: true },
          { attendanceConfirmed: true },
          { attendanceConfirmed: false },
        ],
        _count: { registrations: 124 },
      });
      mockPrisma.eventRegistration.count.mockResolvedValue(8);

      const result = await service.getStats('evt-1');

      expect(result.views).toBe(450);
      expect(result.saves).toBe(87);
      expect(result.likes).toBe(142);
      expect(result.registrations).toBe(124);
      expect(result.attended).toBe(2);
      expect(result.cancellations).toBe(8);
    });

    it('should throw NotFoundException for non-existing event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getStats('non-existing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getUserEvents ────────────────────────────────────────────────────────────

  describe('getUserEvents', () => {
    it('should return user registered events', async () => {
      mockPrisma.eventRegistration.count.mockResolvedValue(2);
      mockPrisma.eventRegistration.findMany.mockResolvedValue([
        {
          id: 'reg-1',
          status: 'confirmed',
          attendanceConfirmed: false,
          registeredAt: new Date(),
          event: { id: 'evt-1', title: 'Webinaire', startAt: new Date(), endAt: new Date(), timezone: 'Europe/Paris', meetingUrl: 'https://meet.google.com/xxx', registeredCount: 50 },
        },
      ]);

      const result = await service.getUserEvents('user-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].event.title).toBe('Webinaire');
      expect(result.data[0].registrationId).toBe('reg-1');
    });
  });
});
