import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BadRequestException } from '@nestjs/common';

const mockBlogService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getCategories: jest.fn(),
  uploadImage: jest.fn(),
  uploadImages: jest.fn(),
  getImages: jest.fn(),
  reorderImages: jest.fn(),
  deleteImage: jest.fn(),
  toggleLike: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
};

describe('BlogController', () => {
  let controller: BlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [{ provide: BlogService, useValue: mockBlogService }],
    }).compile();

    controller = module.get<BlogController>(BlogController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should pass isAdmin=true for admin user', async () => {
      mockBlogService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({} as any, { role: 'admin' });

      expect(mockBlogService.findAll).toHaveBeenCalledWith({}, true);
    });

    it('should pass isAdmin=true for blog_manager', async () => {
      mockBlogService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({} as any, { role: 'blog_manager' });

      expect(mockBlogService.findAll).toHaveBeenCalledWith({}, true);
    });

    it('should pass isAdmin=true for responsable', async () => {
      mockBlogService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({} as any, { role: 'responsable' });

      expect(mockBlogService.findAll).toHaveBeenCalledWith({}, true);
    });

    it('should pass isAdmin=false for regular member', async () => {
      mockBlogService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({} as any, { role: 'member' });

      expect(mockBlogService.findAll).toHaveBeenCalledWith({}, false);
    });

    it('should pass isAdmin=false when no user', async () => {
      mockBlogService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({} as any, undefined);

      expect(mockBlogService.findAll).toHaveBeenCalledWith({}, false);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockBlogService.findOne.mockResolvedValue({ id: 'art-1', title: 'Test' });

      const result = await controller.findOne('art-1', undefined, undefined);

      expect(mockBlogService.findOne).toHaveBeenCalledWith('art-1', false);
      expect(result.id).toBe('art-1');
    });

    it('should enable preview for admin with preview=true', async () => {
      mockBlogService.findOne.mockResolvedValue({ id: 'art-1' });

      await controller.findOne('art-1', 'true', { role: 'admin' });

      expect(mockBlogService.findOne).toHaveBeenCalledWith('art-1', true);
    });

    it('should not enable preview for non-admin', async () => {
      mockBlogService.findOne.mockResolvedValue({ id: 'art-1' });

      await controller.findOne('art-1', 'true', { role: 'member' });

      expect(mockBlogService.findOne).toHaveBeenCalledWith('art-1', false);
    });
  });

  // ── findBySlug ──────────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('should call service.findBySlug', async () => {
      mockBlogService.findBySlug.mockResolvedValue({ slug: 'my-article' });

      const result = await controller.findBySlug('my-article', undefined, undefined);

      expect(mockBlogService.findBySlug).toHaveBeenCalledWith('my-article', false);
      expect(result.slug).toBe('my-article');
    });

    it('should enable preview for blog_manager', async () => {
      mockBlogService.findBySlug.mockResolvedValue({ slug: 'draft-article' });

      await controller.findBySlug('draft-article', 'true', { role: 'blog_manager' });

      expect(mockBlogService.findBySlug).toHaveBeenCalledWith('draft-article', true);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = { title: 'New Article', category: 'tech' } as any;
      mockBlogService.create.mockResolvedValue({ id: 'art-new' });

      const result = await controller.create(dto);

      expect(mockBlogService.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('art-new');
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { title: 'Updated' } as any;
      mockBlogService.update.mockResolvedValue({ id: 'art-1', title: 'Updated' });

      const result = await controller.update('art-1', dto);

      expect(mockBlogService.update).toHaveBeenCalledWith('art-1', dto);
      expect(result.title).toBe('Updated');
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockBlogService.remove.mockResolvedValue({ deleted: { postId: 'art-1', imagesDeleted: 0, commentsDeleted: 0 } });

      const result = await controller.remove('art-1');

      expect(mockBlogService.remove).toHaveBeenCalledWith('art-1');
      expect(result.deleted.postId).toBe('art-1');
    });
  });

  // ── getCategories ───────────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('should return categories', async () => {
      const cats = [{ category: 'tech', slug: 'tech', count: 5 }];
      mockBlogService.getCategories.mockResolvedValue(cats);

      const result = await controller.getCategories();

      expect(result).toEqual(cats);
    });
  });

  // ── uploadImage ─────────────────────────────────────────────────────────────

  describe('uploadImage', () => {
    it('should call service.uploadImage with file and dto', async () => {
      const file = { buffer: Buffer.from('img'), originalname: 'test.jpg' } as Express.Multer.File;
      const dto = { alt: 'test image' } as any;
      mockBlogService.uploadImage.mockResolvedValue({ id: 'img-1', url: 'https://cdn/img.jpg' });

      const result = await controller.uploadImage(file, dto);

      expect(mockBlogService.uploadImage).toHaveBeenCalledWith(file, dto);
      expect(result.id).toBe('img-1');
    });

    it('should throw BadRequestException if no file', () => {
      expect(() => controller.uploadImage(undefined as any, {} as any)).toThrow(BadRequestException);
    });
  });

  // ── uploadImages ────────────────────────────────────────────────────────────

  describe('uploadImages', () => {
    it('should call service.uploadImages with files and postId', async () => {
      const files = [{ buffer: Buffer.from('img') }] as Express.Multer.File[];
      mockBlogService.uploadImages.mockResolvedValue({ uploaded: 1, failed: 0, images: [] });

      await controller.uploadImages(files, 'post-1');

      expect(mockBlogService.uploadImages).toHaveBeenCalledWith(files, 'post-1');
    });

    it('should throw BadRequestException if no files', () => {
      expect(() => controller.uploadImages([], undefined)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if files is null', () => {
      expect(() => controller.uploadImages(null as any, undefined)).toThrow(BadRequestException);
    });
  });

  // ── getImages ───────────────────────────────────────────────────────────────

  describe('getImages', () => {
    it('should call service.getImages', async () => {
      mockBlogService.getImages.mockResolvedValue({ cover: null, body: [] });

      const result = await controller.getImages('art-1');

      expect(mockBlogService.getImages).toHaveBeenCalledWith('art-1');
      expect(result).toHaveProperty('cover');
    });
  });

  // ── reorderImages ───────────────────────────────────────────────────────────

  describe('reorderImages', () => {
    it('should call service.reorderImages', async () => {
      const dto = { order: [{ imageId: 'img-1', position: 0 }] } as any;
      mockBlogService.reorderImages.mockResolvedValue({ updated: 1 });

      await controller.reorderImages('art-1', dto);

      expect(mockBlogService.reorderImages).toHaveBeenCalledWith('art-1', dto);
    });
  });

  // ── deleteImage ─────────────────────────────────────────────────────────────

  describe('deleteImage', () => {
    it('should call service.deleteImage', async () => {
      mockBlogService.deleteImage.mockResolvedValue({ deletedImageId: 'img-1', contentBlockRemoved: true });

      const result = await controller.deleteImage('img-1');

      expect(mockBlogService.deleteImage).toHaveBeenCalledWith('img-1');
      expect(result.deletedImageId).toBe('img-1');
    });
  });

  // ── toggleLike ──────────────────────────────────────────────────────────────

  describe('toggleLike', () => {
    it('should call service.toggleLike with article id and user id', async () => {
      mockBlogService.toggleLike.mockResolvedValue({ likesCount: 5, liked: true });

      const result = await controller.toggleLike('art-1', { id: 'user-1' });

      expect(mockBlogService.toggleLike).toHaveBeenCalledWith('art-1', 'user-1');
      expect(result.liked).toBe(true);
    });
  });

  // ── getComments ─────────────────────────────────────────────────────────────

  describe('getComments', () => {
    it('should call service.getComments with pagination', async () => {
      mockBlogService.getComments.mockResolvedValue({ data: [], meta: { total: 0 } });

      const result = await controller.getComments('art-1', 1, 20);

      expect(mockBlogService.getComments).toHaveBeenCalledWith('art-1', 1, 20);
      expect(result.meta.total).toBe(0);
    });

    it('should pass custom page and perPage', async () => {
      mockBlogService.getComments.mockResolvedValue({ data: [], meta: { total: 50 } });

      await controller.getComments('art-1', 3, 10);

      expect(mockBlogService.getComments).toHaveBeenCalledWith('art-1', 3, 10);
    });
  });

  // ── addComment ──────────────────────────────────────────────────────────────

  describe('addComment', () => {
    it('should pass userId when authenticated', async () => {
      const dto = { content: 'Great article!' } as any;
      mockBlogService.addComment.mockResolvedValue({ id: 'cmt-1' });

      await controller.addComment('art-1', dto, { id: 'user-1' });

      expect(mockBlogService.addComment).toHaveBeenCalledWith('art-1', dto, 'user-1');
    });

    it('should pass undefined userId when not authenticated', async () => {
      const dto = { content: 'Nice!', authorName: 'Anon', authorEmail: 'a@b.com' } as any;
      mockBlogService.addComment.mockResolvedValue({ id: 'cmt-2' });

      await controller.addComment('art-1', dto, undefined);

      expect(mockBlogService.addComment).toHaveBeenCalledWith('art-1', dto, undefined);
    });
  });

  // ── deleteComment ───────────────────────────────────────────────────────────

  describe('deleteComment', () => {
    it('should call service.deleteComment with postId and commentId', async () => {
      mockBlogService.deleteComment.mockResolvedValue({ deletedCommentId: 'cmt-1', repliesDeleted: 2 });

      const result = await controller.deleteComment('art-1', 'cmt-1');

      expect(mockBlogService.deleteComment).toHaveBeenCalledWith('art-1', 'cmt-1');
      expect(result.deletedCommentId).toBe('cmt-1');
    });
  });
});
