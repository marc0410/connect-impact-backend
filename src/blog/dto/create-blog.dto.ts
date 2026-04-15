import {
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlogDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Auto-généré depuis title si absent' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  excerpt: string;

  @ApiProperty({ description: 'Tableau de ContentBlock (heading | text | image | quote)' })
  @IsArray()
  content: ContentBlock[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  coverImageId?: string;

  @ApiProperty()
  @IsUUID()
  authorId: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'], default: 'draft' })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export type ContentBlock =
  | { type: 'text'; html: string }
  | { type: 'image'; imageId: string; caption?: string; fullWidth?: boolean }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'heading'; level: 2 | 3; text: string };
