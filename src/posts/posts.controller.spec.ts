import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

const mockPostsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  submitPost: jest.fn(),
  reviewSubmission: jest.fn(),
  uploadImage: jest.fn(),
  uploadImages: jest.fn(),
  getImages: jest.fn(),
  deleteImage: jest.fn(),
  toggleSave: jest.fn(),
  toggleLike: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
  getStats: jest.fn(),
};

describe('PostsController', () => {
  let controller: PostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with query and isAdmin=false for non-admin', async () => {
      mockPostsService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 12, totalPages: 0 } });

      const result = await controller.findAll({ page: 1, perPage: 12 }, { role: 'member' });

      expect(mockPostsService.findAll).toHaveBeenCalledWith({ page: 1, perPage: 12 }, false);
      expect(result.data).toEqual([]);
    });

    it('should set isAdmin=true for admin user', async () => {
      mockPostsService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 12, totalPages: 0 } });

      await controller.findAll({}, { role: 'admin' });

      expect(mockPostsService.findAll).toHaveBeenCalledWith({}, true);
    });

    it('should set isAdmin=true for responsable', async () => {
      mockPostsService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 12, totalPages: 0 } });

      await controller.findAll({}, { role: 'responsable' });

      expect(mockPostsService.findAll).toHaveBeenCalledWith({}, true);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockPostsService.findOne.mockResolvedValue({ id: 'uuid', title: 'Test' });

      const result = await controller.findOne('uuid');

      expect(mockPostsService.findOne).toHaveBeenCalledWith('uuid');
      expect(result.id).toBe('uuid');
    });
  });

  describe('create', () => {
    it('should pass publisherId from current user', async () => {
      mockPostsService.create.mockResolvedValue({ id: 'new-id' });

      await controller.create({ type: 'opportunity' } as any, { id: 'admin-id', role: 'admin' });

      expect(mockPostsService.create).toHaveBeenCalledWith({ type: 'opportunity' }, 'admin-id');
    });
  });

  describe('submit', () => {
    it('should pass userId from current user', async () => {
      mockPostsService.submitPost.mockResolvedValue({ id: 'id', status: 'draft', message: 'ok' });

      await controller.submit({ type: 'bonplan' } as any, { id: 'user-id' });

      expect(mockPostsService.submitPost).toHaveBeenCalledWith({ type: 'bonplan' }, 'user-id');
    });
  });

  describe('review', () => {
    it('should forward action and body to service', async () => {
      mockPostsService.reviewSubmission.mockResolvedValue({});

      await controller.review('uuid', { action: 'approve', tags: ['Vérifié'] });

      expect(mockPostsService.reviewSubmission).toHaveBeenCalledWith('uuid', 'approve', { action: 'approve', tags: ['Vérifié'] });
    });
  });

  describe('toggleSave', () => {
    it('should call toggleSave with post id and user id', async () => {
      mockPostsService.toggleSave.mockResolvedValue({ savesCount: 5, saved: true });

      const result = await controller.toggleSave('post-id', { id: 'user-id' });

      expect(mockPostsService.toggleSave).toHaveBeenCalledWith('post-id', 'user-id');
      expect(result.saved).toBe(true);
    });
  });

  describe('toggleLike', () => {
    it('should call toggleLike with post id and user id', async () => {
      mockPostsService.toggleLike.mockResolvedValue({ likesCount: 10, liked: true });

      const result = await controller.toggleLike('post-id', { id: 'user-id' });

      expect(mockPostsService.toggleLike).toHaveBeenCalledWith('post-id', 'user-id');
      expect(result.liked).toBe(true);
    });
  });

  describe('getComments', () => {
    it('should pass pagination params', async () => {
      mockPostsService.getComments.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.getComments('post-id', 2, 10);

      expect(mockPostsService.getComments).toHaveBeenCalledWith('post-id', 2, 10);
    });
  });

  describe('addComment', () => {
    it('should pass userId from user when authenticated', async () => {
      mockPostsService.addComment.mockResolvedValue({ id: 'c-1' });

      await controller.addComment('post-id', { content: 'Test' }, { id: 'user-id' });

      expect(mockPostsService.addComment).toHaveBeenCalledWith('post-id', { content: 'Test' }, 'user-id');
    });

    it('should pass undefined userId when not authenticated', async () => {
      mockPostsService.addComment.mockResolvedValue({ id: 'c-1' });

      await controller.addComment('post-id', { content: 'Test' }, undefined);

      expect(mockPostsService.addComment).toHaveBeenCalledWith('post-id', { content: 'Test' }, undefined);
    });
  });

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      mockPostsService.getStats.mockResolvedValue({ views: 100, saves: 20, likes: 50, comments: 12 });

      const result = await controller.getStats('post-id');

      expect(result.views).toBe(100);
    });
  });
});
