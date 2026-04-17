import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ description: 'Texte alternatif (obligatoire)' })
  @IsString()
  alt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'Associer à un article existant' })
  @IsOptional()
  @IsUUID()
  postId?: string;
}
