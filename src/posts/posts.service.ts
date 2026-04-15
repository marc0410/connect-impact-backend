import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UploadImageDto } from './dto/upload-image.dto';
// Prisma types used via 'as any' casting for enum compatibility

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

const POST_LIST_SELECT = {
  id: true,
  type: true,
  title: true,
  slug: true,
  excerpt: true,
  category: true,
  domain: true,
  tags: true,
  featured: true,
  status: true,
  viewsCount: true,
  savesCount: true,
  likesCount: true,
  postedAt: true,
  expiresAt: true,
  validUntil: true,
  publishedAt: true,
  publisher: {
    select: { id: true, username: true, memberProfile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
  },
  images: {
    where: { order: 0 },
    select: { id: true, url: true, alt: true, width: true, height: true, caption: true },
    take: 1,
  },
};

const POST_FULL_SELECT = {
  ...POST_LIST_SELECT,
  description: true,
  opportunityData: true,
  bonplanData: true,
  resourceData: true,
  images: {
    orderBy: { order: 'asc' as const },
    select: { id: true, url: true, alt: true, caption: true, width: true, height: true, size: true, mimeType: true, order: true },
  },
  comments: {
    where: { parentId: null },
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    select: {
      id: true,
      content: true,
      likes: true,
      parentId: true,
      authorName: true,
      createdAt: true,
      author: { select: { id: true, username: true, memberProfile: { select: { avatarUrl: true } } } },
      replies: {
        orderBy: { createdAt: 'asc' as const },
        select: {
          id: true,
          content: true,
          likes: true,
          parentId: true,
          authorName: true,
          createdAt: true,
          author: { select: { id: true, username: true, memberProfile: { select: { avatarUrl: true } } } },
        },
      },
    },
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

function formatPostList(post: any) {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    domain: post.domain,
    tags: post.tags,
    featured: post.featured,
    status: post.status,
    viewsCount: post.viewsCount,
    savesCount: post.savesCount,
    likesCount: post.likesCount,
    postedAt: post.postedAt,
    expiresAt: post.expiresAt,
    validUntil: post.validUntil,
    publishedAt: post.publishedAt,
    publisher: formatAuthor(post.publisher),
    coverImage: post.images?.[0],
  };
}

function formatPostFull(post: any) {
  return {
    ...formatPostList(post),
    description: post.description,
    opportunityData: post.opportunityData,
    bonplanData: post.bonplanData,
    resourceData: post.resourceData,
    images: post.images || [],
    comments: post.comments || [],
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Posts ────────────────────────────────────────────────────────────────────

  async findAll(query: PostsQueryDto, isAdmin = false) {
    const { page = 1, perPage = 12, type, category, domain, q, status = 'published', sort = 'postedAt:desc' } = query;
    let queryStatus = status;

    if (!isAdmin && (queryStatus === 'draft' || queryStatus === 'all')) queryStatus = 'published';

    const where: any = {};
    if (queryStatus !== 'all') where.status = queryStatus;
    if (type) where.type = type;
    if (category) where.category = category;
    if (domain) where.domain = domain;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [sortField, sortDir] = sort.split(':');
    const orderBy = { [sortField]: sortDir ?? 'desc' };

    const [total, data] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
        select: POST_LIST_SELECT,
      }),
    ]);

    return {
      data: data.map(formatPostList),
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: POST_FULL_SELECT,
    });

    if (!post) throw new NotFoundException(`Post ${id} introuvable`);
    if (post.status !== 'published') throw new NotFoundException(`Post ${id} introuvable`);

    await this.prisma.post.update({ where: { id }, data: { viewsCount: { increment: 1 } } });

    return formatPostFull(post);
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!post) throw new NotFoundException(`Post "${slug}" introuvable`);
    return this.findOne(post.id);
  }

  async create(dto: CreatePostDto, publisherId: string) {
    const slug = dto.slug ?? slugify(dto.title);

    const existing = await this.prisma.post.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Le slug "${slug}" est déjà utilisé`);

    const post = await this.prisma.post.create({
      data: {
        type: dto.type as any,
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        description: dto.description,
        category: dto.category,
        domain: dto.domain,
        tags: dto.tags || [],
        featured: dto.featured ?? false,
        status: (dto.status ?? 'draft') as any,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        postedAt: dto.postedAt ? new Date(dto.postedAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        publisherId,
        opportunityData: dto.opportunityData || null,
        bonplanData: dto.bonplanData || null,
        resourceData: dto.resourceData || null,
      },
      select: { id: true },
    });

    return this.findOne(post.id);
  }

  async update(id: string, dto: UpdatePostDto) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Post ${id} introuvable`);

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.post.findUnique({ where: { slug: dto.slug } });
      if (slugConflict) throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);
    }

    await this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.excerpt && { excerpt: dto.excerpt }),
        ...(dto.description && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.featured !== undefined && { featured: dto.featured }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.publishedAt !== undefined && { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null }),
        ...(dto.postedAt !== undefined && { postedAt: dto.postedAt ? new Date(dto.postedAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.validUntil !== undefined && { validUntil: dto.validUntil ? new Date(dto.validUntil) : null }),
        ...(dto.opportunityData && { opportunityData: dto.opportunityData }),
        ...(dto.bonplanData && { bonplanData: dto.bonplanData }),
        ...(dto.resourceData && { resourceData: dto.resourceData }),
      },
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { images: true, _count: { select: { comments: true } } },
    });
    if (!post) throw new NotFoundException(`Post ${id} introuvable`);

    // Delete images from Cloudinary
    await Promise.allSettled(post.images.map((img) => this.cloudinary.deleteImage(img.publicId)));

    const commentsDeleted = post._count.comments;
    await this.prisma.post.delete({ where: { id } });

    return {
      deleted: {
        postId: id,
        imagesDeleted: post.images.length,
        commentsDeleted,
      },
    };
  }

  async submitPost(dto: CreatePostDto, userId: string) {
    const slug = dto.slug ?? slugify(dto.title);

    const existing = await this.prisma.post.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Le slug "${slug}" est déjà utilisé`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Utilisateur ${userId} introuvable`);

    const post = await this.prisma.post.create({
      data: {
        type: dto.type as any,
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        description: dto.description,
        category: dto.category,
        domain: dto.domain,
        tags: [],
        featured: false,
        status: 'draft' as any,
        publishedAt: null,
        publisherId: userId,
        submittedBy: { userId, name: user.username ?? 'Anonyme' },
        opportunityData: dto.opportunityData || null,
        bonplanData: dto.bonplanData || null,
        resourceData: dto.resourceData || null,
      },
      select: { id: true },
    });

    return {
      id: post.id,
      status: 'draft',
      message: 'Votre contribution a été soumise et sera examinée sous 48h.',
    };
  }

  async reviewSubmission(id: string, action: 'approve' | 'reject', data: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post ${id} introuvable`);
    if (post.status !== 'draft') throw new BadRequestException(`Ce post n'est pas en attente de validation`);

    if (action === 'approve') {
      await this.prisma.post.update({
        where: { id },
        data: {
          status: 'published' as any,
          tags: data.tags || post.tags,
          featured: data.featured ?? post.featured,
          publishedAt: new Date(),
        },
      });
    } else {
      await this.prisma.post.delete({ where: { id } });
      return {
        message: `La contribution a été rejetée${data.reason ? ': ' + data.reason : '.'}`,
      };
    }

    return this.findOne(id);
  }

  // ── Images ───────────────────────────────────────────────────────────────────

  async uploadImage(file: Express.Multer.File, dto: UploadImageDto) {
    const result = await this.cloudinary.uploadImage(file, 'posts');

    const image = await this.prisma.postImage.create({
      data: {
        postId: dto.postId ?? null,
        url: result.secure_url,
        publicId: result.public_id,
        alt: dto.alt,
        caption: dto.caption,
        width: result.width,
        height: result.height,
        size: result.bytes,
        mimeType: `image/${result.format}`,
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

  async getImages(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        images: {
          orderBy: { order: 'asc' },
          select: { id: true, url: true, alt: true, caption: true, width: true, height: true, order: true },
        },
      },
    });
    if (!post) throw new NotFoundException(`Post ${postId} introuvable`);

    return post.images;
  }

  async deleteImage(imageId: string) {
    const image = await this.prisma.postImage.findUnique({ where: { id: imageId } });
    if (!image) throw new NotFoundException(`Image ${imageId} introuvable`);

    await this.cloudinary.deleteImage(image.publicId);
    await this.prisma.postImage.delete({ where: { id: imageId } });

    return { deletedImageId: imageId };
  }

  // ── Engagement ───────────────────────────────────────────────────────────────

  async toggleSave(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post ${postId} introuvable`);

    const existing = await this.prisma.postSave.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postSave.delete({ where: { postId_userId: { postId, userId } } });
      await this.prisma.post.update({ where: { id: postId }, data: { savesCount: { decrement: 1 } } });
      const updated = await this.prisma.post.findUnique({ where: { id: postId }, select: { savesCount: true } });
      return { savesCount: updated!.savesCount, saved: false };
    } else {
      await this.prisma.postSave.create({ data: { postId, userId } });
      await this.prisma.post.update({ where: { id: postId }, data: { savesCount: { increment: 1 } } });
      const updated = await this.prisma.post.findUnique({ where: { id: postId }, select: { savesCount: true } });
      return { savesCount: updated!.savesCount, saved: true };
    }
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post ${postId} introuvable`);
    if (post.type === 'opportunity') throw new BadRequestException('Les opportunités ne peuvent pas être aimées');

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
      await this.prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
      const updated = await this.prisma.post.findUnique({ where: { id: postId }, select: { likesCount: true } });
      return { likesCount: updated!.likesCount, liked: false };
    } else {
      await this.prisma.postLike.create({ data: { postId, userId } });
      await this.prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
      const updated = await this.prisma.post.findUnique({ where: { id: postId }, select: { likesCount: true } });
      return { likesCount: updated!.likesCount, liked: true };
    }
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  async getComments(postId: string, page = 1, perPage = 20) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post ${postId} introuvable`);

    const where = { postId, parentId: null };
    const [total, data] = await Promise.all([
      this.prisma.postComment.count({ where }),
      this.prisma.postComment.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          likes: true,
          parentId: true,
          authorName: true,
          createdAt: true,
          author: { select: { id: true, username: true, memberProfile: { select: { avatarUrl: true } } } },
          replies: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              content: true,
              likes: true,
              parentId: true,
              authorName: true,
              createdAt: true,
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

  async addComment(postId: string, dto: CreateCommentDto, userId?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post ${postId} introuvable`);

    if (dto.parentId) {
      const parent = await this.prisma.postComment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Commentaire parent invalide');
      }
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        authorId: userId ?? null,
        authorName: dto.authorName || (userId ? 'Utilisateur' : 'Anonyme'),
        authorEmail: dto.authorEmail,
        content: dto.content,
        parentId: dto.parentId ?? null,
      },
      select: {
        id: true,
        content: true,
        likes: true,
        parentId: true,
        authorName: true,
        createdAt: true,
        author: { select: { id: true, username: true } },
      },
    });

    return comment;
  }

  async deleteComment(postId: string, commentId: string) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      include: { _count: { select: { replies: true } } },
    });
    if (!comment || comment.postId !== postId) {
      throw new NotFoundException(`Commentaire ${commentId} introuvable`);
    }

    const repliesDeleted = comment._count.replies;
    await this.prisma.postComment.delete({ where: { id: commentId } });

    return { deletedCommentId: commentId, repliesDeleted };
  }

  // ── Statistics ───────────────────────────────────────────────────────────────

  async getStats(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        viewsCount: true,
        savesCount: true,
        likesCount: true,
        _count: { select: { comments: true } },
      },
    });

    if (!post) throw new NotFoundException(`Post ${postId} introuvable`);

    return {
      views: post.viewsCount,
      saves: post.savesCount,
      likes: post.likesCount,
      comments: post._count.comments,
    };
  }
}
