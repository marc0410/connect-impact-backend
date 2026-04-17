import { IsOptional, IsIn, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PostsQueryDto {
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @Min(1)
  @Max(50)
  perPage?: number = 12;

  @IsOptional()
  @IsIn(['opportunity', 'bonplan', 'resource'])
  type?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsIn(['published', 'draft', 'archived', 'expired', 'all'])
  status?: string = 'published';

  @IsOptional()
  @IsString()
  sort?: string = 'postedAt:desc';

  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  remote?: string;
}
