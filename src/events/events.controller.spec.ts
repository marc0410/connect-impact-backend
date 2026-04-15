import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

const mockEventsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  registerForEvent: jest.fn(),
  unregisterFromEvent: jest.fn(),
  getRegistrations: jest.fn(),
  updateAttendance: jest.fn(),
  getUserEvents: jest.fn(),
  toggleSave: jest.fn(),
  toggleLike: jest.fn(),
  getStats: jest.fn(),
};

describe('EventsController', () => {
  let controller: EventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should pass isAdmin=true for admin', async () => {
      mockEventsService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({}, { role: 'admin' });

      expect(mockEventsService.findAll).toHaveBeenCalledWith({}, true);
    });

    it('should pass isAdmin=true for responsable', async () => {
      mockEventsService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({}, { role: 'responsable' });

      expect(mockEventsService.findAll).toHaveBeenCalledWith({}, true);
    });

    it('should pass isAdmin=false for non-admin', async () => {
      mockEventsService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({}, { role: 'member' });

      expect(mockEventsService.findAll).toHaveBeenCalledWith({}, false);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockEventsService.findOne.mockResolvedValue({ id: 'evt-1' });

      const result = await controller.findOne('evt-1');

      expect(result.id).toBe('evt-1');
    });
  });

  describe('create', () => {
    it('should pass organizerId from current user', async () => {
      mockEventsService.create.mockResolvedValue({ id: 'evt-new' });

      await controller.create({ type: 'webinaire' } as any, { id: 'admin-id' });

      expect(mockEventsService.create).toHaveBeenCalledWith({ type: 'webinaire' }, 'admin-id');
    });
  });

  describe('register', () => {
    it('should pass userId when authenticated', async () => {
      mockEventsService.registerForEvent.mockResolvedValue({ registrationId: 'r-1', status: 'confirmed' });

      await controller.register('evt-1', { firstName: 'Jean', lastName: 'Dupont' }, { id: 'user-1' });

      expect(mockEventsService.registerForEvent).toHaveBeenCalledWith(
        'evt-1',
        { firstName: 'Jean', lastName: 'Dupont' },
        'user-1',
      );
    });

    it('should pass undefined userId when not authenticated', async () => {
      mockEventsService.registerForEvent.mockResolvedValue({ registrationId: 'r-1', status: 'confirmed' });

      await controller.register('evt-1', { firstName: 'Jean', lastName: 'Dupont', email: 'j@e.com' }, undefined);

      expect(mockEventsService.registerForEvent).toHaveBeenCalledWith(
        'evt-1',
        { firstName: 'Jean', lastName: 'Dupont', email: 'j@e.com' },
        undefined,
      );
    });
  });

  describe('toggleSave', () => {
    it('should call service with correct params', async () => {
      mockEventsService.toggleSave.mockResolvedValue({ savesCount: 5, saved: true });

      const result = await controller.toggleSave('evt-1', { id: 'user-1' });

      expect(mockEventsService.toggleSave).toHaveBeenCalledWith('evt-1', 'user-1');
      expect(result.saved).toBe(true);
    });
  });

  describe('toggleLike', () => {
    it('should call service with correct params', async () => {
      mockEventsService.toggleLike.mockResolvedValue({ likesCount: 10, liked: true });

      const result = await controller.toggleLike('evt-1', { id: 'user-1' });

      expect(result.liked).toBe(true);
    });
  });

  describe('updateAttendance', () => {
    it('should pass dto to service', async () => {
      mockEventsService.updateAttendance.mockResolvedValue({ updated: 3, message: 'ok' });

      await controller.updateAttendance('evt-1', { registrationIds: ['r1', 'r2', 'r3'], attended: true });

      expect(mockEventsService.updateAttendance).toHaveBeenCalledWith('evt-1', {
        registrationIds: ['r1', 'r2', 'r3'],
        attended: true,
      });
    });
  });

  describe('getStats', () => {
    it('should return event statistics', async () => {
      mockEventsService.getStats.mockResolvedValue({
        views: 450, saves: 87, likes: 142, registrations: 124, attended: 89, cancellations: 8,
      });

      const result = await controller.getStats('evt-1');

      expect(result.views).toBe(450);
      expect(result.registrations).toBe(124);
    });
  });
});
