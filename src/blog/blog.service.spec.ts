import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { PrismaService } from '../config/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const mockPrisma = {
  article: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
  },
  blogImage: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  blogLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  comment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

const mockCloudinary = {
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
};

describe('BlogService', () => {
  let service: BlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated articles', async () => {
      const mockArticles = [
        {
          id: 'art-1',
          title: 'Conseils entretien ONG',
          slug: 'conseils-entretien-ong',
          excerpt: 'Résumé court',
          category: 'Conseils',
          tags: ['Entretien'],
          readTime: '5 min',
          views: 200,
          likes: 30,
          publishedAt: new Date(),
          createdAt: new Date(),
          coverImage: null,
          author: { id: 'u-1', username: 'admin', memberProfile: { firstName: 'Admin', lastName: 'User', avatarUrl: null } },
          _count: { comments: 5 },
        },
      ];

      mockPrisma.article.count.mockResolvedValue(1);
      mockPrisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.perPage).toBe(12);
      expect(result.meta.totalPages).toBe(1);
      expect(result.data[0].author.name).toBe('Admin User');
      expect(result.data[0].commentsCount).toBe(5);
    });

    it('should filter by category', async () => {
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ category: 'Tech' });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'Tech' }),
        }),
      );
    });

    it('should filter by tag', async () => {
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ tag: 'Conseils' });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tags: { has: 'Conseils' } }),
        }),
      );
    });

    it('should prevent non-admins from seeing drafts', async () => {
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'draft' }, false);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('should allow admins to see drafts', async () => {
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'draft' }, true);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'draft' }),
        }),
      );
    });

    it('should allow admin to see all statuses', async () => {
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'all' }, true);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ status: expect.anything() }),
        }),
      );
    });

    it('should handle full-text search on title and excerpt', async () => {
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ q: 'impact' });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'impact', mode: 'insensitive' } },
              { excerpt: { contains: 'impact', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should handle sorting', async () => {
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ sort: 'views:desc' });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { views: 'desc' },
        }),
      );
    });

    it('should handle pagination', async () => {
      mockPrisma.article.count.mockResolvedValue(50);
      mockPrisma.article.findMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 3, perPage: 10 });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(5);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should throw NotFoundException for non-existing article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-published article (without preview)', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'art-1', status: 'draft' });

      await expect(service.findOne('art-1', false)).rejects.toThrow(NotFoundException);
    });

    it('should allow preview of draft articles', async () => {
      const mockArticle = {
        id: 'art-1',
        title: 'Draft article',
        slug: 'draft-article',
        status: 'draft',
        views: 0,
        likes: 0,
        content: [],
        images: [],
        comments: [],
        author: { id: 'u-1', username: 'admin', memberProfile: null },
        _count: { comments: 0 },
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findOne('art-1', true);

      expect(result).toBeDefined();
      // Should NOT increment views on preview
      expect(mockPrisma.article.update).not.toHaveBeenCalled();
    });

    it('should increment views on non-preview access', async () => {
      const mockArticle = {
        id: 'art-1',
        title: 'Published article',
        slug: 'published-article',
        status: 'published',
        views: 99,
        likes: 10,
        content: [{ type: 'text', html: '<p>Hello</p>' }],
        images: [],
        comments: [],
        author: { id: 'u-1', username: 'admin', memberProfile: null },
        _count: { comments: 2 },
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
      mockPrisma.article.update.mockResolvedValue({});

      await service.findOne('art-1', false);

      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 'art-1' },
        data: { views: { increment: 1 } },
      });
    });
  });

  // ── findBySlug ───────────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('should throw NotFoundException for non-existing slug', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('non-existing-slug')).rejects.toThrow(NotFoundException);
    });

    it('should delegate to findOne with the resolved id', async () => {
      mockPrisma.article.findUnique
        .mockResolvedValueOnce({ id: 'art-1' }) // slug lookup
        .mockResolvedValue({
          id: 'art-1',
          title: 'Test',
          slug: 'test',
          status: 'published',
          views: 0,
          likes: 0,
          content: [],
          images: [],
          comments: [],
          author: { id: 'u-1', username: 'admin', memberProfile: null },
          _count: { comments: 0 },
        });
      mockPrisma.article.update.mockResolvedValue({});

      const result = await service.findBySlug('test');

      expect(result.id).toBe('art-1');
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          title: 'Test',
          excerpt: 'Short',
          content: [],
          authorId: 'u-1',
          category: 'Tech',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should auto-generate slug from title', async () => {
      mockPrisma.article.findUnique
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValue({
          id: 'new-art',
          title: 'Mon Article Français',
          slug: 'mon-article-francais',
          status: 'published',
          views: 0,
          likes: 0,
          content: [],
          images: [],
          comments: [],
          author: { id: 'u-1', username: 'admin', memberProfile: null },
          _count: { comments: 0 },
        });
      mockPrisma.article.create.mockResolvedValue({ id: 'new-art' });
      mockPrisma.article.update.mockResolvedValue({});

      await service.create({
        title: 'Mon Article Français',
        excerpt: 'Résumé',
        content: [],
        authorId: 'u-1',
        category: 'Conseils',
      } as any);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'mon-article-francais' }),
        }),
      );
    });

    it('should calculate readTime from text content blocks', async () => {
      const content = [
        { type: 'text', html: '<p>' + 'word '.repeat(400) + '</p>' },
        { type: 'heading', level: 2, text: 'Section' },
        { type: 'text', html: '<p>' + 'word '.repeat(200) + '</p>' },
      ];

      mockPrisma.article.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue({
          id: 'new-art',
          title: 'Long article',
          slug: 'long-article',
          status: 'published',
          views: 0,
          likes: 0,
          content,
          images: [],
          comments: [],
          author: { id: 'u-1', username: 'admin', memberProfile: null },
          _count: { comments: 0 },
        });
      mockPrisma.article.create.mockResolvedValue({ id: 'new-art' });
      mockPrisma.article.update.mockResolvedValue({});

      await service.create({
        title: 'Long article',
        excerpt: 'Summary',
        content,
        authorId: 'u-1',
        category: 'Guides',
      } as any);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            readTime: '4 min', // ~600 words / 200 wpm ≈ 4 (trailing spaces add tokens)
          }),
        }),
      );
    });

    it('should associate body images from content blocks', async () => {
      const content = [
        { type: 'text', html: '<p>Intro</p>' },
        { type: 'image', imageId: 'img-1' },
        { type: 'image', imageId: 'img-2' },
      ];

      mockPrisma.article.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue({
          id: 'new-art',
          title: 'With images',
          slug: 'with-images',
          status: 'published',
          views: 0,
          likes: 0,
          content,
          images: [],
          comments: [],
          author: { id: 'u-1', username: 'admin', memberProfile: null },
          _count: { comments: 0 },
        });
      mockPrisma.article.create.mockResolvedValue({ id: 'new-art' });
      mockPrisma.article.update.mockResolvedValue({});
      mockPrisma.blogImage.updateMany.mockResolvedValue({ count: 1 });

      await service.create({
        title: 'With images',
        excerpt: 'Has images',
        content,
        authorId: 'u-1',
        category: 'Tech',
      } as any);

      // Should associate both images with correct order
      expect(mockPrisma.blogImage.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.blogImage.updateMany).toHaveBeenCalledWith({
        where: { id: 'img-1', articleId: null },
        data: { articleId: 'new-art', order: 1 },
      });
      expect(mockPrisma.blogImage.updateMany).toHaveBeenCalledWith({
        where: { id: 'img-2', articleId: null },
        data: { articleId: 'new-art', order: 2 },
      });
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException for non-existing article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existing', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate slug change', async () => {
      mockPrisma.article.findUnique
        .mockResolvedValueOnce({ id: 'art-1', slug: 'old-slug' })
        .mockResolvedValue({ id: 'art-2', slug: 'taken-slug' });

      await expect(service.update('art-1', { slug: 'taken-slug' })).rejects.toThrow(ConflictException);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException for non-existing article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should delete all images from Cloudinary and cascade', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({
        id: 'art-1',
        images: [
          { id: 'img-1', publicId: 'blog/img-1' },
          { id: 'img-2', publicId: 'blog/img-2' },
        ],
        coverImage: { id: 'cover-1', publicId: 'blog/cover-1' },
        _count: { comments: 5 },
      });
      mockPrisma.article.delete.mockResolvedValue({});
      mockCloudinary.deleteImage.mockResolvedValue({});

      const result = await service.remove('art-1');

      expect(mockCloudinary.deleteImage).toHaveBeenCalledTimes(3); // 2 body + 1 cover
      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('blog/img-1');
      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('blog/img-2');
      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('blog/cover-1');
      expect(result.deleted.imagesDeleted).toBe(3);
      expect(result.deleted.commentsDeleted).toBe(5);
    });
  });

  // ── uploadImage ────────────────────────────────────────────────────────────

  describe('uploadImage', () => {
    it('should upload to Cloudinary "blog" folder and store metadata', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockCloudinary.uploadImage.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/blog/photo.webp',
        public_id: 'blog/photo123',
        width: 1200,
        height: 800,
        bytes: 120000,
        format: 'webp',
      });

      mockPrisma.blogImage.create.mockResolvedValue({
        id: 'img-new',
        url: 'https://res.cloudinary.com/test/blog/photo.webp',
        publicId: 'blog/photo123',
        alt: 'Photo article',
        width: 1200,
        height: 800,
        size: 120000,
        mimeType: 'image/webp',
      });

      const result = await service.uploadImage(mockFile, { alt: 'Photo article' });

      expect(mockCloudinary.uploadImage).toHaveBeenCalledWith(mockFile, 'blog');
      expect(mockPrisma.blogImage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          url: 'https://res.cloudinary.com/test/blog/photo.webp',
          publicId: 'blog/photo123',
          alt: 'Photo article',
          width: 1200,
          height: 800,
          size: 120000,
          mimeType: 'image/webp',
        }),
      });
      expect(result.id).toBe('img-new');
    });
  });

  // ── deleteImage ────────────────────────────────────────────────────────────

  describe('deleteImage', () => {
    it('should throw NotFoundException for non-existing image', async () => {
      mockPrisma.blogImage.findUnique.mockResolvedValue(null);

      await expect(service.deleteImage('non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should delete from Cloudinary and remove from article content', async () => {
      const articleContent = [
        { type: 'text', html: '<p>Intro</p>' },
        { type: 'image', imageId: 'img-to-delete' },
        { type: 'text', html: '<p>After image</p>' },
      ];

      mockPrisma.blogImage.findUnique.mockResolvedValue({
        id: 'img-to-delete',
        publicId: 'blog/img-to-delete',
        articleId: 'art-1',
      });
      mockPrisma.article.findUnique.mockResolvedValue({
        id: 'art-1',
        content: articleContent,
      });
      mockPrisma.article.update.mockResolvedValue({});
      mockPrisma.blogImage.delete.mockResolvedValue({});
      mockCloudinary.deleteImage.mockResolvedValue({});

      const result = await service.deleteImage('img-to-delete');

      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('blog/img-to-delete');
      expect(result.contentBlockRemoved).toBe(true);
      // The content should be updated without the image block
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 'art-1' },
        data: {
          content: [
            { type: 'text', html: '<p>Intro</p>' },
            { type: 'text', html: '<p>After image</p>' },
          ],
        },
      });
    });
  });

  // ── toggleLike ─────────────────────────────────────────────────────────────

  describe('toggleLike', () => {
    it('should throw NotFoundException for non-existing article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.toggleLike('non-existing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should create like when not already liked', async () => {
      mockPrisma.article.findUnique
        .mockResolvedValueOnce({ id: 'art-1' })
        .mockResolvedValue({ likes: 11 });
      mockPrisma.blogLike.findUnique.mockResolvedValue(null);
      mockPrisma.blogLike.create.mockResolvedValue({});
      mockPrisma.article.update.mockResolvedValue({});

      const result = await service.toggleLike('art-1', 'user-1');

      expect(result.liked).toBe(true);
      expect(result.likes).toBe(11);
      expect(mockPrisma.blogLike.create).toHaveBeenCalledWith({
        data: { articleId: 'art-1', userId: 'user-1' },
      });
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 'art-1' },
        data: { likes: { increment: 1 } },
      });
    });

    it('should remove like when already liked', async () => {
      mockPrisma.article.findUnique
        .mockResolvedValueOnce({ id: 'art-1' })
        .mockResolvedValue({ likes: 9 });
      mockPrisma.blogLike.findUnique.mockResolvedValue({ id: 'like-1' });
      mockPrisma.blogLike.delete.mockResolvedValue({});
      mockPrisma.article.update.mockResolvedValue({});

      const result = await service.toggleLike('art-1', 'user-1');

      expect(result.liked).toBe(false);
      expect(result.likes).toBe(9);
      expect(mockPrisma.blogLike.delete).toHaveBeenCalled();
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 'art-1' },
        data: { likes: { decrement: 1 } },
      });
    });
  });

  // ── Comments ───────────────────────────────────────────────────────────────

  describe('getComments', () => {
    it('should throw NotFoundException for non-existing article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.getComments('non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should return paginated comments with replies', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'art-1' });
      mockPrisma.comment.count.mockResolvedValue(2);
      mockPrisma.comment.findMany.mockResolvedValue([
        {
          id: 'c-1',
          content: 'Top article !',
          authorName: 'Jean',
          replies: [{ id: 'r-1', content: 'Merci !' }],
        },
        {
          id: 'c-2',
          content: 'Très utile',
          authorName: 'Marie',
          replies: [],
        },
      ]);

      const result = await service.getComments('art-1', 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.data[0].replies).toHaveLength(1);
    });
  });

  describe('addComment', () => {
    it('should throw NotFoundException for non-existing article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(
        service.addComment('non-existing', { content: 'Test', authorName: 'Jean' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid parentId', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'art-1' });
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.addComment('art-1', { content: 'Reply', authorName: 'Jean', parentId: 'bad-parent' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a root comment', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'art-1' });
      mockPrisma.comment.create.mockResolvedValue({
        id: 'c-new',
        content: 'Great article!',
        authorName: 'Jean',
        parentId: null,
      });

      const result = await service.addComment('art-1', { content: 'Great article!', authorName: 'Jean' });

      expect(result.id).toBe('c-new');
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            articleId: 'art-1',
            content: 'Great article!',
            authorName: 'Jean',
            parentId: null,
          }),
        }),
      );
    });

    it('should create a reply to existing comment', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'art-1' });
      mockPrisma.comment.findUnique.mockResolvedValue({ id: 'parent-c', articleId: 'art-1' });
      mockPrisma.comment.create.mockResolvedValue({
        id: 'reply-c',
        content: 'Thanks!',
        authorName: 'Marie',
        parentId: 'parent-c',
      });

      const result = await service.addComment('art-1', {
        content: 'Thanks!',
        authorName: 'Marie',
        parentId: 'parent-c',
      });

      expect(result.parentId).toBe('parent-c');
    });
  });

  describe('deleteComment', () => {
    it('should throw NotFoundException for non-existing comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.deleteComment('art-1', 'non-existing')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if comment belongs to different article', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        articleId: 'other-article',
        _count: { replies: 0 },
      });

      await expect(service.deleteComment('art-1', 'c-1')).rejects.toThrow(NotFoundException);
    });

    it('should delete comment and return reply count', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        articleId: 'art-1',
        _count: { replies: 4 },
      });
      mockPrisma.comment.delete.mockResolvedValue({});

      const result = await service.deleteComment('art-1', 'c-1');

      expect(result.deletedCommentId).toBe('c-1');
      expect(result.repliesDeleted).toBe(4);
    });
  });

  // ── getCategories ──────────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('should return grouped categories with counts', async () => {
      mockPrisma.article.groupBy.mockResolvedValue([
        { category: 'Tech', _count: { category: 12 } },
        { category: 'Social', _count: { category: 8 } },
        { category: 'Environnement', _count: { category: 5 } },
      ]);

      const result = await service.getCategories();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Tech', slug: 'tech', count: 12 });
      expect(result[1]).toEqual({ name: 'Social', slug: 'social', count: 8 });
      expect(result[2]).toEqual({ name: 'Environnement', slug: 'environnement', count: 5 });
    });
  });
});
