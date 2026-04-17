import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsQueryDto } from './dto/events-query.dto';
import { EventRegisterDto, UpdateAttendanceDto } from './dto/event-register.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const EVENT_LIST_SELECT = {
  id: true,
  type: true,
  title: true,
  slug: true,
  description: true,
  startAt: true,
  endAt: true,
  timezone: true,
  meetingUrl: true,
  capacity: true,
  registeredCount: true,
  domain: true,
  tags: true,
  language: true,
  featured: true,
  status: true,
  viewsCount: true,
  savesCount: true,
  likesCount: true,
  publishedAt: true,
  organizer: {
    select: { id: true, username: true, memberProfile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
  },
  speakers: {
    orderBy: { order: 'asc' as const },
    select: { id: true, name: true, role: true, avatarUrl: true, linkedinUrl: true, order: true },
  },
};

const EVENT_FULL_SELECT = {
  ...EVENT_LIST_SELECT,
  content: true,
};

function formatAuthor(author: any) {
  const p = author?.memberProfile;
  return {
    id: author?.id,
    name: p ? `${p.firstName} ${p.lastName}` : author?.username ?? 'Anonyme',
    avatarUrl: p?.avatarUrl ?? null,
  };
}

function formatEvent(event: any) {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    slug: event.slug,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    timezone: event.timezone,
    meetingUrl: event.meetingUrl,
    capacity: event.capacity,
    registeredCount: event.registeredCount,
    domain: event.domain,
    tags: event.tags,
    language: event.language,
    featured: event.featured,
    status: event.status,
    viewsCount: event.viewsCount,
    savesCount: event.savesCount,
    likesCount: event.likesCount,
    publishedAt: event.publishedAt,
    organizer: formatAuthor(event.organizer),
    speakers: event.speakers || [],
    content: event.content || [],
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Events ───────────────────────────────────────────────────────────────────

  async findAll(query: EventsQueryDto, isAdmin = false) {
    const { page = 1, perPage = 12, type, domain, q, status = 'upcoming,ongoing', sort = 'startAt:asc', from, to } = query;

    const where: any = {};

    // Status filtering
    if (!isAdmin) {
      where.status = { in: ['upcoming', 'ongoing', 'completed'] };
    } else if (status !== 'all') {
      const statuses = status.split(',').map((s) => s.trim());
      if (statuses.length > 0) {
        where.status = { in: statuses };
      }
    }

    if (type) where.type = type;
    if (domain) where.domain = domain;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (from) {
      where.startAt = { gte: new Date(from) };
    }
    if (to) {
      where.endAt = { lte: new Date(to) };
    }

    const [sortField, sortDir] = sort.split(':');
    const orderBy = { [sortField]: sortDir ?? 'asc' };

    const [total, data] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
        select: EVENT_LIST_SELECT,
      }),
    ]);

    return {
      data: data.map(formatEvent),
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: EVENT_FULL_SELECT,
    });

    if (!event) throw new NotFoundException(`Événement ${id} introuvable`);

    await this.prisma.event.update({ where: { id }, data: { viewsCount: { increment: 1 } } });

    return formatEvent(event);
  }

  async findBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!event) throw new NotFoundException(`Événement "${slug}" introuvable`);
    return this.findOne(event.id);
  }

  async create(dto: CreateEventDto, organizerId: string) {
    const slug = dto.slug ?? slugify(dto.title);

    const existing = await this.prisma.event.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Le slug "${slug}" est déjà utilisé`);

    const event = await this.prisma.event.create({
      data: {
        type: dto.type as any,
        title: dto.title,
        slug,
        description: dto.description,
        content: dto.content ? (dto.content as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        organizerId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        timezone: dto.timezone,
        meetingUrl: dto.meetingUrl,
        capacity: dto.capacity ?? null,
        domain: dto.domain,
        tags: dto.tags || [],
        language: dto.language,
        featured: dto.featured ?? false,
        status: (dto.status ?? 'draft') as any,
      },
      select: { id: true },
    });

    // Create speakers
    if (dto.speakers && dto.speakers.length > 0) {
      await this.prisma.eventSpeaker.createMany({
        data: dto.speakers.map((s, idx) => ({
          eventId: event.id,
          name: s.name,
          bio: s.bio,
          role: s.role,
          company: s.company,
          avatarUrl: s.avatarUrl,
          linkedinUrl: s.linkedinUrl,
          order: s.order ?? idx + 1,
        })),
      });
    }

    return this.findOne(event.id);
  }

  async update(id: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Événement ${id} introuvable`);

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.event.findUnique({ where: { slug: dto.slug } });
      if (slugConflict) throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.description) updateData.description = dto.description;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.startAt) updateData.startAt = new Date(dto.startAt);
    if (dto.endAt) updateData.endAt = new Date(dto.endAt);
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
    if (dto.meetingUrl) updateData.meetingUrl = dto.meetingUrl;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.domain !== undefined) updateData.domain = dto.domain;
    if (dto.tags) updateData.tags = dto.tags;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.featured !== undefined) updateData.featured = dto.featured;
    if (dto.status) updateData.status = dto.status;

    await this.prisma.event.update({
      where: { id },
      data: updateData,
    });

    // Update speakers if provided
    if (dto.speakers) {
      await this.prisma.eventSpeaker.deleteMany({ where: { eventId: id } });
      if (dto.speakers.length > 0) {
        await this.prisma.eventSpeaker.createMany({
          data: dto.speakers.map((s, idx) => ({
            eventId: id,
            name: s.name,
            bio: s.bio,
            role: s.role,
            company: s.company,
            avatarUrl: s.avatarUrl,
            linkedinUrl: s.linkedinUrl,
            order: s.order ?? idx + 1,
          })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) throw new NotFoundException(`Événement ${id} introuvable`);

    const registrationsDeleted = event._count.registrations;
    await this.prisma.event.delete({ where: { id } });

    return {
      deleted: {
        eventId: id,
        registrationsDeleted,
      },
    };
  }

  // ── Registrations ────────────────────────────────────────────────────────────

  async registerForEvent(eventId: string, dto: EventRegisterDto, userId?: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Événement ${eventId} introuvable`);

    // Check capacity
    if (event.capacity && event.capacity > 0 && event.registeredCount >= event.capacity) {
      throw new BadRequestException('Cet événement est complet');
    }

    // If authenticated, fetch email from user profile
    let email = dto.email;
    if (!email && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      email = user?.email;
    }
    if (!email) throw new BadRequestException('Email requis pour l\'inscription');

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId: userId ?? null,
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        company: dto.company,
        status: 'confirmed' as any,
      },
    });

    // Increment registered count
    await this.prisma.event.update({
      where: { id: eventId },
      data: { registeredCount: { increment: 1 } },
    });

    return {
      registrationId: registration.id,
      status: 'confirmed',
      message: 'Inscription confirmée. Un lien de connexion a été envoyé à ' + registration.email,
    };
  }

  async unregisterFromEvent(eventId: string, registrationId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration || registration.eventId !== eventId) {
      throw new NotFoundException(`Inscription ${registrationId} introuvable`);
    }

    await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: 'cancelled' as any },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { registeredCount: { decrement: 1 } },
    });

    return { cancelled: true };
  }

  async getRegistrations(eventId: string, page = 1, perPage = 50, status?: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Événement ${eventId} introuvable`);

    const where: any = { eventId };
    if (status) where.status = status;

    const [total, data] = await Promise.all([
      this.prisma.eventRegistration.count({ where }),
      this.prisma.eventRegistration.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { registeredAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async updateAttendance(eventId: string, dto: UpdateAttendanceDto) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Événement ${eventId} introuvable`);

    const updated = await this.prisma.eventRegistration.updateMany({
      where: { id: { in: dto.registrationIds }, eventId },
      data: { attendanceConfirmed: dto.attended },
    });

    return {
      updated: updated.count,
      message: `Présence confirmée pour ${updated.count} participants.`,
    };
  }

  async getUserEvents(userId: string, status?: string, page = 1, perPage = 12) {
    const where: any = { userId };
    if (status) where.status = status;

    const [total, registrations] = await Promise.all([
      this.prisma.eventRegistration.count({ where }),
      this.prisma.eventRegistration.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { registeredAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startAt: true,
              endAt: true,
              timezone: true,
              meetingUrl: true,
              registeredCount: true,
            },
          },
        },
      }),
    ]);

    const data = registrations.map((r) => ({
      event: r.event,
      registrationId: r.id,
      status: r.status,
      attendanceConfirmed: r.attendanceConfirmed,
      registeredAt: r.registeredAt,
    }));

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  // ── Engagement ───────────────────────────────────────────────────────────────

  async toggleSave(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Événement ${eventId} introuvable`);

    const existing = await this.prisma.eventSave.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
      await this.prisma.eventSave.delete({ where: { eventId_userId: { eventId, userId } } });
      await this.prisma.event.update({ where: { id: eventId }, data: { savesCount: { decrement: 1 } } });
      const updated = await this.prisma.event.findUnique({ where: { id: eventId }, select: { savesCount: true } });
      return { savesCount: updated!.savesCount, saved: false };
    } else {
      await this.prisma.eventSave.create({ data: { eventId, userId } });
      await this.prisma.event.update({ where: { id: eventId }, data: { savesCount: { increment: 1 } } });
      const updated = await this.prisma.event.findUnique({ where: { id: eventId }, select: { savesCount: true } });
      return { savesCount: updated!.savesCount, saved: true };
    }
  }

  async toggleLike(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Événement ${eventId} introuvable`);

    const existing = await this.prisma.eventLike.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
      await this.prisma.eventLike.delete({ where: { eventId_userId: { eventId, userId } } });
      await this.prisma.event.update({ where: { id: eventId }, data: { likesCount: { decrement: 1 } } });
      const updated = await this.prisma.event.findUnique({ where: { id: eventId }, select: { likesCount: true } });
      return { likesCount: updated!.likesCount, liked: false };
    } else {
      await this.prisma.eventLike.create({ data: { eventId, userId } });
      await this.prisma.event.update({ where: { id: eventId }, data: { likesCount: { increment: 1 } } });
      const updated = await this.prisma.event.findUnique({ where: { id: eventId }, select: { likesCount: true } });
      return { likesCount: updated!.likesCount, liked: true };
    }
  }

  // ── Statistics ───────────────────────────────────────────────────────────────

  async getStats(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: 'confirmed' },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) throw new NotFoundException(`Événement ${eventId} introuvable`);

    const attendedCount = event.registrations.filter((r) => r.attendanceConfirmed).length;
    const cancelledCount = await this.prisma.eventRegistration.count({
      where: { eventId, status: 'cancelled' },
    });

    return {
      views: event.viewsCount,
      saves: event.savesCount,
      likes: event.likesCount,
      registrations: event._count.registrations,
      attended: attendedCount,
      cancellations: cancelledCount,
    };
  }
}
