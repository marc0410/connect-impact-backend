import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  authorEmail?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
