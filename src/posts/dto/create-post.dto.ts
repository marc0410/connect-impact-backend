import { IsString, IsOptional, IsArray, IsEnum, IsISO8601, IsBoolean, MaxLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export type ContentBlock =
  | { type: 'text'; html: string }
  | { type: 'image'; imageId: string; caption?: string; fullWidth?: boolean }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'cta'; label: string; url: string; style?: 'primary' | 'secondary' };

export enum PostType {
  OPPORTUNITY = 'opportunity',
  BONPLAN = 'bonplan',
  RESOURCE = 'resource',
}

export enum PostStatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
}

export class CreatePostDto {
  @IsEnum(PostType)
  type: PostType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean = false;

  @IsOptional()
  @IsEnum(PostStatusEnum)
  status?: PostStatusEnum = PostStatusEnum.DRAFT;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  @IsOptional()
  @IsISO8601()
  postedAt?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  // Opportunity-specific fields
  @IsOptional()
  opportunityData?: any;

  // BonPlan-specific fields
  @IsOptional()
  bonplanData?: any;

  // Resource-specific fields
  @IsOptional()
  resourceData?: any;
}
