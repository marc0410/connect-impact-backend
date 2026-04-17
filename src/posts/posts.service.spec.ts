import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../config/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const mockPrisma = {
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  postImage: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  postSave: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  postLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  postComment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockCloudinary = {
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
};

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        {
          id: 'uuid-1',
          type: 'opportunity',
          title: 'Stage développeur',
          slug: 'stage-developpeur',
          excerpt: 'Un super stage',
          category: 'Tech',
          domain: 'Tech',
          tags: ['Nouveau'],
          featured: true,
          status: 'published',
          viewsCount: 100,
          savesCount: 20,
          likesCount: 0,
          postedAt: new Date(),
          expiresAt: null,
          validUntil: null,
          publishedAt: new Date(),
          publisher: { id: 'user-1', username: 'admin', memberProfile: null },
          images: [],
        },
      ];

      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.findAll({ page: 1, perPage: 12 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.perPage).toBe(12);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by type', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.findAll({ type: 'bonplan' });

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'bonplan' }),
        }),
      );
    });

    it('should filter by domain', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.findAll({ domain: 'Tech' });

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ domain: 'Tech' }),
        }),
      );
    });

    it('should prevent non-admins from seeing drafts', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'draft' }, false);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('should allow admins to see drafts', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'draft' }, true);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'draft' }),
        }),
      );
    });

    it('should handle full-text search', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.findAll({ q: 'développeur' });

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'développeur', mode: 'insensitive' } },
              { description: { contains: 'développeur', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should throw NotFoundException for non-existing post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existing-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-published post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'uuid', status: 'draft' });

      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
    });

    it('should increment view count', async () => {
      const mockPost = {
        id: 'uuid-1',
        type: 'opportunity',
        title: 'Test',
        slug: 'test',
        status: 'published',
        viewsCount: 10,
        savesCount: 0,
        likesCount: 0,
        description: 'desc',
        publisher: { id: 'user-1', username: 'admin', memberProfile: null },
        images: [],
        comments: [],
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await service.findOne('uuid-1');

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { viewsCount: { increment: 1 } },
      });
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          { type: 'opportunity' as any, title: 'Test', description: 'desc', category: 'Tech' } as any,
          'publisher-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should auto-generate slug from title', async () => {
      mockPrisma.post.findUnique
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValue({
          id: 'new-id',
          type: 'opportunity',
          title: 'Mon Titre Français',
          slug: 'mon-titre-francais',
          status: 'published',
          viewsCount: 0,
          savesCount: 0,
          likesCount: 0,
          description: 'desc',
          publisher: { id: 'user-1', username: 'admin', memberProfile: null },
          images: [],
          comments: [],
        });
      mockPrisma.post.create.mockResolvedValue({ id: 'new-id' });
      mockPrisma.post.update.mockResolvedValue({});

      await service.create(
        { type: 'opportunity' as any, title: 'Mon Titre Français', description: 'desc', category: 'Tech' } as any,
        'publisher-id',
      );

      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'mon-titre-francais' }),
        }),
      );
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException for non-existing post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should delete images from Cloudinary on remove', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'uuid-1',
        images: [
          { id: 'img-1', publicId: 'posts/img-1' },
          { id: 'img-2', publicId: 'posts/img-2' },
        ],
        _count: { comments: 3 },
      });
      mockPrisma.post.delete.mockResolvedValue({});
      mockCloudinary.deleteImage.mockResolvedValue({});

      const result = await service.remove('uuid-1');

      expect(mockCloudinary.deleteImage).toHaveBeenCalledTimes(2);
      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('posts/img-1');
      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('posts/img-2');
      expect(result.deleted.imagesDeleted).toBe(2);
      expect(result.deleted.commentsDeleted).toBe(3);
    });
  });

  // ── submitPost ───────────────────────────────────────────────────────────────

  describe('submitPost', () => {
    it('should create post as draft with submittedBy data', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'kofi' });
      mockPrisma.post.create.mockResolvedValue({ id: 'new-post' });

      const result = await service.submitPost(
        { type: 'opportunity' as any, title: 'Mon offre', description: 'desc', category: 'Tech' } as any,
        'user-1',
      );

      expect(result.status).toBe('draft');
      expect(result.message).toContain('soumise');
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'draft',
            featured: false,
            tags: [],
            submittedBy: { userId: 'user-1', name: 'kofi' },
          }),
        }),
      );
    });
  });

  // ── reviewSubmission ─────────────────────────────────────────────────────────

  describe('reviewSubmission', () => {
    it('should throw NotFoundException for non-existing post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.reviewSubmission('non-existing', 'approve', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-draft post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'uuid', status: 'published' });

      await expect(service.reviewSubmission('uuid', 'approve', {})).rejects.toThrow(BadRequestException);
    });

    it('should approve draft and set status to published', async () => {
      mockPrisma.post.findUnique
        .mockResolvedValueOnce({ id: 'uuid', status: 'draft', tags: [], featured: false })
        .mockResolvedValue({
          id: 'uuid',
          type: 'opportunity',
          title: 'Test',
          slug: 'test',
          status: 'published',
          viewsCount: 0,
          savesCount: 0,
          likesCount: 0,
          description: 'desc',
          publisher: { id: 'user-1', username: 'admin', memberProfile: null },
          images: [],
          comments: [],
        });
      mockPrisma.post.update.mockResolvedValue({});

      await service.reviewSubmission('uuid', 'approve', { tags: ['Vérifié'] });

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid' },
          data: expect.objectContaining({
            status: 'published',
            tags: ['Vérifié'],
          }),
        }),
      );
    });

    it('should delete post on rejection', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'uuid', status: 'draft' });
      mockPrisma.post.delete.mockResolvedValue({});

      const result = await service.reviewSubmission('uuid', 'reject', { reason: 'Offre expirée' });

      expect(mockPrisma.post.delete).toHaveBeenCalledWith({ where: { id: 'uuid' } });
      expect((result as any).message).toContain('rejetée');
      expect((result as any).message).toContain('Offre expirée');
    });
  });

  // ── Engagement: toggleSave ───────────────────────────────────────────────────

  describe('toggleSave', () => {
    it('should throw NotFoundException for non-existing post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.toggleSave('non-existing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should create save when not already saved', async () => {
      mockPrisma.post.findUnique
        .mockResolvedValueOnce({ id: 'post-1' })
        .mockResolvedValue({ savesCount: 1 });
      mockPrisma.postSave.findUnique.mockResolvedValue(null);
      mockPrisma.postSave.create.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({});

      const result = await service.toggleSave('post-1', 'user-1');

      expect(result.saved).toBe(true);
      expect(mockPrisma.postSave.create).toHaveBeenCalled();
    });

    it('should remove save when already saved', async () => {
      mockPrisma.post.findUnique
        .mockResolvedValueOnce({ id: 'post-1' })
        .mockResolvedValue({ savesCount: 0 });
      mockPrisma.postSave.findUnique.mockResolvedValue({ id: 'save-1' });
      mockPrisma.postSave.delete.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({});

      const result = await service.toggleSave('post-1', 'user-1');

      expect(result.saved).toBe(false);
      expect(mockPrisma.postSave.delete).toHaveBeenCalled();
    });
  });

  // ── Engagement: toggleLike ───────────────────────────────────────────────────

  describe('toggleLike', () => {
    it('should throw BadRequestException for opportunities', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', type: 'opportunity' });

      await expect(service.toggleLike('post-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow likes on bonplans', async () => {
      mockPrisma.post.findUnique
        .mockResolvedValueOnce({ id: 'post-1', type: 'bonplan' })
        .mockResolvedValue({ likesCount: 1 });
      mockPrisma.postLike.findUnique.mockResolvedValue(null);
      mockPrisma.postLike.create.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({});

      const result = await service.toggleLike('post-1', 'user-1');

      expect(result.liked).toBe(true);
    });

    it('should allow likes on resources', async () => {
      mockPrisma.post.findUnique
        .mockResolvedValueOnce({ id: 'post-1', type: 'resource' })
        .mockResolvedValue({ likesCount: 1 });
      mockPrisma.postLike.findUnique.mockResolvedValue(null);
      mockPrisma.postLike.create.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({});

      const result = await service.toggleLike('post-1', 'user-1');

      expect(result.liked).toBe(true);
    });
  });

  // ── Images (Cloudinary) ──────────────────────────────────────────────────────

  describe('uploadImage', () => {
    it('should upload to Cloudinary and create PostImage', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockCloudinary.uploadImage.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image.webp',
        public_id: 'posts/img-123',
        width: 800,
        height: 600,
        bytes: 50000,
        format: 'webp',
      });

      mockPrisma.postImage.create.mockResolvedValue({
        id: 'img-id',
        url: 'https://res.cloudinary.com/test/image.webp',
        publicId: 'posts/img-123',
        alt: 'My image',
        width: 800,
        height: 600,
        size: 50000,
        mimeType: 'image/webp',
      });

      const result = await service.uploadImage(mockFile, { alt: 'My image' });

      expect(mockCloudinary.uploadImage).toHaveBeenCalledWith(mockFile, 'posts');
      expect(mockPrisma.postImage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          url: 'https://res.cloudinary.com/test/image.webp',
          publicId: 'posts/img-123',
          alt: 'My image',
          width: 800,
          height: 600,
          size: 50000,
          mimeType: 'image/webp',
        }),
      });
      expect(result.id).toBe('img-id');
    });
  });

  describe('deleteImage', () => {
    it('should delete from Cloudinary and DB', async () => {
      mockPrisma.postImage.findUnique.mockResolvedValue({
        id: 'img-1',
        publicId: 'posts/img-123',
      });
      mockPrisma.postImage.delete.mockResolvedValue({});
      mockCloudinary.deleteImage.mockResolvedValue({});

      const result = await service.deleteImage('img-1');

      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('posts/img-123');
      expect(mockPrisma.postImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
      expect(result.deletedImageId).toBe('img-1');
    });

    it('should throw NotFoundException for non-existing image', async () => {
      mockPrisma.postImage.findUnique.mockResolvedValue(null);

      await expect(service.deleteImage('non-existing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Comments ─────────────────────────────────────────────────────────────────

  describe('getComments', () => {
    it('should return paginated comments', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrisma.postComment.count.mockResolvedValue(2);
      mockPrisma.postComment.findMany.mockResolvedValue([
        { id: 'c-1', content: 'Test', authorName: 'Jean', replies: [] },
        { id: 'c-2', content: 'Test 2', authorName: 'Marie', replies: [] },
      ]);

      const result = await service.getComments('post-1', 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('addComment', () => {
    it('should create a comment', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrisma.postComment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'Super article !',
        authorName: 'Jean',
      });

      const result = await service.addComment('post-1', { content: 'Super article !', authorName: 'Jean' });

      expect(result.content).toBe('Super article !');
    });

    it('should validate parent comment exists for replies', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrisma.postComment.findUnique.mockResolvedValue(null);

      await expect(
        service.addComment('post-1', { content: 'Reply', parentId: 'non-existing' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment and return reply count', async () => {
      mockPrisma.postComment.findUnique.mockResolvedValue({
        id: 'c-1',
        postId: 'post-1',
        _count: { replies: 3 },
      });
      mockPrisma.postComment.delete.mockResolvedValue({});

      const result = await service.deleteComment('post-1', 'c-1');

      expect(result.repliesDeleted).toBe(3);
    });
  });

  // ── Statistics ───────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return stats for a post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        viewsCount: 100,
        savesCount: 20,
        likesCount: 50,
        _count: { comments: 12 },
      });

      const result = await service.getStats('post-1');

      expect(result.views).toBe(100);
      expect(result.saves).toBe(20);
      expect(result.likes).toBe(50);
      expect(result.comments).toBe(12);
    });

    it('should throw NotFoundException for non-existing post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.getStats('non-existing')).rejects.toThrow(NotFoundException);
    });
  });
});
