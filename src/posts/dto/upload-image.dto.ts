import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UploadImageDto {
  @IsString()
  alt: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsUUID()
  postId?: string;
}
