import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsQueryDto } from './dto/events-query.dto';
import { EventRegisterDto, UpdateAttendanceDto } from './dto/event-register.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ── Events ───────────────────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister les événements' })
  findAll(@Query() query: EventsQueryDto, @CurrentUser() user?: any) {
    const isAdmin = user?.role === 'admin' || user?.role === 'responsable' || user?.role === 'blog_manager';
    return this.eventsService.findAll(query, isAdmin);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Récupérer un événement par son slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Récupérer les détails d\'un événement' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un événement (admin)' })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: any) {
    return this.eventsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier un événement (admin)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un événement (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.remove(id);
  }

  // ── Registrations ────────────────────────────────────────────────────────────

  @Post(':id/register')
  @Public()
  @ApiOperation({ summary: 'S\'inscrire à un événement' })
  register(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EventRegisterDto, @CurrentUser() user?: any) {
    return this.eventsService.registerForEvent(id, dto, user?.id);
  }

  @Post(':id/unregister')
  @Public()
  @ApiOperation({ summary: 'Annuler l\'inscription à un événement' })
  unregister(@Param('id', ParseUUIDPipe) id: string, @Body('registrationId') registrationId: string) {
    return this.eventsService.unregisterFromEvent(id, registrationId);
  }

  @Get(':id/registrations')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les inscriptions (admin)' })
  getRegistrations(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(50), ParseIntPipe) perPage: number,
    @Query('status') status?: string,
  ) {
    return this.eventsService.getRegistrations(id, page, perPage, status);
  }

  @Patch(':id/attendance')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer la présence (admin)' })
  updateAttendance(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAttendanceDto) {
    return this.eventsService.updateAttendance(id, dto);
  }

  @Get('me/events')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer les événements de l\'utilisateur' })
  getUserEvents(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(12), ParseIntPipe) perPage: number,
    @Query('status') status?: string,
  ) {
    return this.eventsService.getUserEvents(user.id, status, page, perPage);
  }

  // ── Engagement ───────────────────────────────────────────────────────────────

  @Post(':id/saves')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Sauvegarder/Retirer des favoris (toggle)' })
  toggleSave(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.eventsService.toggleSave(id, user.id);
  }

  @Post(':id/likes')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Liker/Unliker un événement (toggle)' })
  toggleLike(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.eventsService.toggleLike(id, user.id);
  }

  // ── Statistics ───────────────────────────────────────────────────────────────

  @Get(':id/stats')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtenir les statistiques d\'un événement (admin)' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.getStats(id);
  }
}
