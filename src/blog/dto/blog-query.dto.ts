import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BlogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  perPage?: number = 12;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['published', 'draft', 'archived', 'all'], default: 'published' })
  @IsOptional()
  @IsIn(['published', 'draft', 'archived', 'all'])
  status?: string = 'published';

  @ApiPropertyOptional({ default: 'publishedAt:desc' })
  @IsOptional()
  @IsIn(['publishedAt:desc', 'publishedAt:asc', 'views:desc', 'likes:desc'])
  sort?: string = 'publishedAt:desc';
}
