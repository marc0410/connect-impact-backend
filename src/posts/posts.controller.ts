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
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const IMAGE_INTERCEPTOR = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return cb(new BadRequestException('Format non supporté (jpg, jpeg, png, webp)'), false);
    }
    cb(null, true);
  },
});

const IMAGES_INTERCEPTOR = FilesInterceptor('files[]', 10, {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return cb(new BadRequestException('Format non supporté'), false);
    }
    cb(null, true);
  },
});

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ── Posts ────────────────────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister les posts (Opportunités, Bons Plans, Ressources)' })
  findAll(@Query() query: PostsQueryDto, @CurrentUser() user?: any) {
    const isAdmin = user?.role === 'admin' || user?.role === 'responsable' || user?.role === 'blog_manager';
    return this.postsService.findAll(query, isAdmin);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Récupérer un post par son slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Récupérer un post complet par ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un post (admin)' })
  create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    return this.postsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier un post (admin)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un post (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.remove(id);
  }

  @Post('submit')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soumettre un post en tant que membre' })
  submit(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    return this.postsService.submitPost(dto, user.id);
  }

  @Patch(':id/review')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Valider ou rejeter une soumission (admin)' })
  review(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.postsService.reviewSubmission(id, body.action, body);
  }

  // ── Images ───────────────────────────────────────────────────────────────────

  @Post(':id/images')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Uploader une image (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
        caption: { type: 'string' },
      },
      required: ['file', 'alt'],
    },
  })
  @UseInterceptors(IMAGE_INTERCEPTOR)
  uploadImage(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadImageDto, @Param('id', ParseUUIDPipe) postId: string) {
    if (!file) throw new BadRequestException('Fichier manquant');
    return this.postsService.uploadImage(file, { ...dto, postId });
  }

  @Post('images/batch')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Uploader plusieurs images (max 10) (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        'files[]': { type: 'array', items: { type: 'string', format: 'binary' } },
        postId: { type: 'string', format: 'uuid' },
      },
      required: ['files[]'],
    },
  })
  @UseInterceptors(IMAGES_INTERCEPTOR)
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('postId') postId?: string,
  ) {
    if (!files?.length) throw new BadRequestException('Aucun fichier reçu');
    return this.postsService.uploadImages(files, postId);
  }

  @Get(':id/images')
  @Public()
  @ApiOperation({ summary: 'Lister les images d\'un post' })
  getImages(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getImages(id);
  }

  @Delete('images/:imageId')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une image (admin)' })
  deleteImage(@Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.postsService.deleteImage(imageId);
  }

  // ── Engagement ───────────────────────────────────────────────────────────────

  @Post(':id/saves')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Sauvegarder/Retirer des favoris (toggle)' })
  toggleSave(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.postsService.toggleSave(id, user.id);
  }

  @Post(':id/likes')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Liker/Unliker un post (toggle)' })
  toggleLike(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.postsService.toggleLike(id, user.id);
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: 'Lister les commentaires (paginé)' })
  getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.postsService.getComments(id, page, perPage);
  }

  @Post(':id/comments')
  @Public()
  @ApiOperation({ summary: 'Ajouter un commentaire' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user?: any,
  ) {
    return this.postsService.addComment(id, dto, user?.id);
  }

  @Delete(':postId/comments/:commentId')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un commentaire (admin)' })
  deleteComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.postsService.deleteComment(postId, commentId);
  }

  // ── Statistics ───────────────────────────────────────────────────────────────

  @Get(':id/stats')
  @Roles('admin', 'responsable', 'blog_manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtenir les statistiques d\'un post (admin)' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getStats(id);
  }
}
