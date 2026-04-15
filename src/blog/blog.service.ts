import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateBlogDto, ContentBlock } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogQueryDto } from './dto/blog-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { ArticleStatus } from '@prisma/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function calcReadTime(content: ContentBlock[]): string {
  const words = content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; html: string }).html.replace(/<[^>]+>/g, ''))
    .join(' ')
    .split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

function extractImageIds(content: ContentBlock[]): string[] {
  return content
    .filter((b) => b.type === 'image')
    .map((b) => (b as { type: 'image'; imageId: string }).imageId);
}

const ARTICLE_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  tags: true,
  readTime: true,
  views: true,
  likes: true,
  publishedAt: true,
  createdAt: true,
  coverImage: {
    select: { id: true, url: true, alt: true, width: true, height: true, caption: true },
  },
  author: {
    select: { id: true, username: true, memberProfile: { select: { avatarUrl: true, firstName: true, lastName: true } } },
  },
  _count: { select: { comments: true } },
};

const ARTICLE_FULL_SELECT = {
  ...ARTICLE_LIST_SELECT,
  content: true,
  status: true,
  metaTitle: true,
  metaDescription: true,
  isFeatured: true,
  updatedAt: true,
  images: {
    orderBy: { order: 'asc' as const },
    select: { id: true, url: true, alt: true, caption: true, width: true, height: true, size: true, mimeType: true, order: true, createdAt: true },
  },
};

function formatAuthor(author: any) {
  const p = author?.memberProfile;
  return {
    id: author?.id,
    name: p ? `${p.firstName} ${p.lastName}` : author?.username ?? 'Anonyme',
    avatarUrl: p?.avatarUrl ?? null,
  };
}

function formatArticleList(article: any) {
  return {
    ...article,
    author: formatAuthor(article.author),
    commentsCount: article._count?.comments ?? 0,
    _count: undefined,
  };
}

function formatArticleFull(article: any) {
  return {
    ...formatArticleList(article),
    content: article.content ?? [],
    images: article.images ?? [],
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Articles ────────────────────────────────────────────────────────────────

  async findAll(query: BlogQueryDto, isAdmin = false) {
    const { page = 1, perPage = 12, category, tag, q, sort = 'publishedAt:desc' } = query;
    let { status = 'published' } = query;

    if (!isAdmin && (status === 'draft' || status === 'all')) status = 'published';

    const where: any = {};
    if (status !== 'all') where.status = status as ArticleStatus;
    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (q) where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
    ];

    const [sortField, sortDir] = sort.split(':');
    const orderBy = { [sortField]: sortDir ?? 'desc' };

    const [total, data] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
        select: ARTICLE_LIST_SELECT,
      }),
    ]);

    return {
      data: data.map(formatArticleList),
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findOne(id: string, preview = false) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: {
        ...ARTICLE_FULL_SELECT,
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, content: true, likes: true, parentId: true, authorName: true, createdAt: true,
            author: { select: { id: true, username: true, memberProfile: { select: { avatarUrl: true } } } },
            replies: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true, content: true, likes: true, parentId: true, authorName: true, createdAt: true,
                author: { select: { id: true, username: true, memberProfile: { select: { avatarUrl: true } } } },
              },
            },
          },
        },
      },
    });

    if (!article) throw new NotFoundException(`Article ${id} introuvable`);
    if (!preview && article.status !== 'published') throw new NotFoundException(`Article ${id} introuvable`);

    if (!preview) {
      await this.prisma.article.update({ where: { id }, data: { views: { increment: 1 } } });
      article.views += 1;
    }

    return formatArticleFull(article);
  }

  async findBySlug(slug: string, preview = false) {
    const article = await this.prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (!article) throw new NotFoundException(`Article "${slug}" introuvable`);
    return this.findOne(article.id, preview);
  }

  async create(dto: CreateBlogDto) {
    const slug = dto.slug ?? slugify(dto.title);

    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Le slug "${slug}" est déjà utilisé`);

    const content = (dto.content ?? []) as ContentBlock[];
    const readTime = calcReadTime(content);

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: content as any,
        coverImageId: dto.coverImageId ?? null,
        authorId: dto.authorId,
        category: dto.category,
        tags: dto.tags ?? [],
        status: (dto.status ?? 'draft') as ArticleStatus,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        readTime,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      select: { id: true },
    });

    // Associate body images to the article
    const imageIds = extractImageIds(content);
    if (imageIds.length > 0) {
      await Promise.all(
        imageIds.map((imageId, idx) =>
          this.prisma.blogImage.updateMany({
            where: { id: imageId, articleId: null },
            data: { articleId: article.id, order: idx + 1 },
          }),
        ),
      );
    }

    return this.findOne(article.id, true);
  }

  async update(id: string, dto: UpdateBlogDto) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Article ${id} introuvable`);

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.article.findUnique({ where: { slug: dto.slug } });
      if (slugConflict) throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);
    }

    const content = dto.content ? (dto.content as ContentBlock[]) : undefined;
    const readTime = content ? calcReadTime(content) : undefined;

    await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.excerpt && { excerpt: dto.excerpt }),
        ...(content && { content: content as any, readTime }),
        ...(dto.coverImageId !== undefined && { coverImageId: dto.coverImageId }),
        ...(dto.category && { category: dto.category }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.status && { status: dto.status as ArticleStatus }),
        ...(dto.publishedAt !== undefined && { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDescription !== undefined && { metaDescription: dto.metaDescription }),
      },
    });

    // Re-associate images if content changed
    if (content) {
      const imageIds = extractImageIds(content);
      await this.prisma.blogImage.updateMany({ where: { articleId: id }, data: { order: 0 } });
      await Promise.all(
        imageIds.map((imageId, idx) =>
          this.prisma.blogImage.updateMany({
            where: { id: imageId },
            data: { articleId: id, order: idx + 1 },
          }),
        ),
      );
    }

    return this.findOne(id, true);
  }

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { images: true, coverImage: true, _count: { select: { comments: true } } },
    });
    if (!article) throw new NotFoundException(`Article ${id} introuvable`);

    const allImages = [...(article.images ?? []), ...(article.coverImage ? [article.coverImage] : [])];

    // Delete from Cloudinary
    await Promise.allSettled(allImages.map((img) => this.cloudinary.deleteImage(img.publicId)));

    const commentsDeleted = article._count.comments;
    await this.prisma.article.delete({ where: { id } });

    return {
      deleted: {
        postId: id,
        imagesDeleted: allImages.length,
        commentsDeleted,
      },
    };
  }

  // ── Images ──────────────────────────────────────────────────────────────────

  async uploadImage(file: Express.Multer.File, dto: UploadImageDto) {
    const result = await this.cloudinary.uploadImage(file, 'blog');

    const image = await this.prisma.blogImage.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        alt: dto.alt,
        caption: dto.caption,
        width: result.width,
        height: result.height,
        size: result.bytes,
        mimeType: `image/${result.format}`,
        articleId: dto.postId ?? null,
        order: 0,
      },
    });

    return image;
  }

  async uploadImages(files: Express.Multer.File[], postId?: string) {
    const results = await Promise.allSettled(
      files.map((f) => this.uploadImage(f, { alt: f.originalname, postId })),
    );

    const uploaded: any[] = [];
    const failed: any[] = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') uploaded.push(r.value);
      else failed.push({ index: i, reason: r.reason?.message });
    });

    return { uploaded, failed };
  }

  async getImages(articleId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: {
        coverImage: { select: { id: true, url: true, alt: true, caption: true, width: true, height: true, order: true } },
        images: {
          orderBy: { order: 'asc' },
          select: { id: true, url: true, alt: true, caption: true, width: true, height: true, order: true },
        },
      },
    });
    if (!article) throw new NotFoundException(`Article ${articleId} introuvable`);

    const list: any[] = [];
    if (article.coverImage) list.push({ ...article.coverImage, order: 0 });
    list.push(...article.images);
    return list;
  }

  async reorderImages(articleId: string, dto: ReorderImagesDto) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException(`Article ${articleId} introuvable`);

    await Promise.all(
      dto.order.map((imageId, idx) =>
        this.prisma.blogImage.updateMany({
          where: { id: imageId, articleId },
          data: { order: idx + 1 },
        }),
      ),
    );

    // Update content[] block order to match
    const content = (article.content as unknown as ContentBlock[]) ?? [];
    const newContent = [
      ...content.filter((b) => b.type !== 'image'),
    ];
    // Rebuild: keep non-image blocks in place, reorder image blocks
    const imageBlocks = dto.order.map((id) =>
      content.find((b) => b.type === 'image' && (b as any).imageId === id),
    ).filter(Boolean);

    const rebuilt: ContentBlock[] = [];
    let imgIdx = 0;
    for (const block of content) {
      if (block.type === 'image') {
        if (imageBlocks[imgIdx]) rebuilt.push(imageBlocks[imgIdx]!);
        imgIdx++;
      } else {
        rebuilt.push(block);
      }
    }

    await this.prisma.article.update({ where: { id: articleId }, data: { content: rebuilt as any } });

    return this.getImages(articleId);
  }

  async deleteImage(imageId: string) {
    const image = await this.prisma.blogImage.findUnique({ where: { id: imageId } });
    if (!image) throw new NotFoundException(`Image ${imageId} introuvable`);

    await this.cloudinary.deleteImage(image.publicId);

    let contentBlockRemoved = false;

    // Remove image block from article content
    if (image.articleId) {
      const article = await this.prisma.article.findUnique({ where: { id: image.articleId } });
      if (article) {
        const content = (article.content as unknown as ContentBlock[]) ?? [];
        const filtered = content.filter(
          (b) => !(b.type === 'image' && (b as any).imageId === imageId),
        );
        contentBlockRemoved = filtered.length < content.length;
        await this.prisma.article.update({ where: { id: image.articleId }, data: { content: filtered as any } });
      }
    }

    await this.prisma.blogImage.delete({ where: { id: imageId } });

    return { deletedImageId: imageId, contentBlockRemoved };
  }

  // ── Likes ───────────────────────────────────────────────────────────────────

  async toggleLike(articleId: string, userId: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException(`Article ${articleId} introuvable`);

    const existing = await this.prisma.blogLike.findUnique({
      where: { articleId_userId: { articleId, userId } },
    });

    if (existing) {
      await this.prisma.blogLike.delete({ where: { articleId_userId: { articleId, userId } } });
      await this.prisma.article.update({ where: { id: articleId }, data: { likes: { decrement: 1 } } });
      const updated = await this.prisma.article.findUnique({ where: { id: articleId }, select: { likes: true } });
      return { likes: updated!.likes, liked: false };
    } else {
      await this.prisma.blogLike.create({ data: { articleId, userId } });
      await this.prisma.article.update({ where: { id: articleId }, data: { likes: { increment: 1 } } });
      const updated = await this.prisma.article.findUnique({ where: { id: articleId }, select: { likes: true } });
      return { likes: updated!.likes, liked: true };
    }
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  async getComments(articleId: string, page = 1, perPage = 20) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException(`Article ${articleId} introuvable`);

    const where = { articleId, parentId: null };
    const [total, data] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, content: true, likes: true, parentId: true, authorName: true, createdAt: true,
          author: { select: { id: true, username: true, memberProfile: { select: { avatarUrl: true } } } },
          replies: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true, content: true, likes: true, parentId: true, authorName: true, createdAt: true,
              author: { select: { id: true, username: true, memberProfile: { select: { avatarUrl: true } } } },
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async addComment(articleId: string, dto: CreateCommentDto, userId?: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException(`Article ${articleId} introuvable`);

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.articleId !== articleId) {
        throw new BadRequestException('Commentaire parent invalide');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        articleId,
        authorId: userId ?? null,
        authorName: dto.authorName,
        authorEmail: dto.authorEmail,
        content: dto.content,
        parentId: dto.parentId ?? null,
      },
      select: {
        id: true, content: true, likes: true, parentId: true, authorName: true, createdAt: true,
        author: { select: { id: true, username: true } },
      },
    });

    return comment;
  }

  async deleteComment(postId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { _count: { select: { replies: true } } },
    });
    if (!comment || comment.articleId !== postId) {
      throw new NotFoundException(`Commentaire ${commentId} introuvable`);
    }

    const repliesDeleted = comment._count.replies;
    await this.prisma.comment.delete({ where: { id: commentId } });

    return { deletedCommentId: commentId, repliesDeleted };
  }

  // ── Categories ───────────────────────────────────────────────────────────────

  async getCategories() {
    const groups = await this.prisma.article.groupBy({
      by: ['category'],
      where: { status: 'published' },
      _count: { category: true },
    });

    return groups.map((g) => ({
      name: g.category,
      slug: slugify(g.category),
      count: g._count.category,
    }));
  }
}
