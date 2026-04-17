import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ description: 'null = commentaire racine, UUID = réponse' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty()
  @IsString()
  authorName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  authorEmail?: string;
}
