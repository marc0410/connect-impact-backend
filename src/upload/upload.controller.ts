import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return cb(new BadRequestException('Format non supporté (jpg, jpeg, png, webp uniquement)'), false);
  }
  cb(null, true);
};

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('cover')
  @ApiOperation({ summary: 'Upload une image de couverture (blog)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  async uploadCover(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fichier manquant');
    const result = await this.cloudinaryService.uploadImage(file, 'covers');
    return { url: result.secure_url, public_id: result.public_id };
  }

  @Post('profile')
  @ApiOperation({ summary: 'Upload une photo de profil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  async uploadProfile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fichier manquant');
    const result = await this.cloudinaryService.uploadImage(file, 'profiles');
    return { url: result.secure_url, public_id: result.public_id };
  }
}
