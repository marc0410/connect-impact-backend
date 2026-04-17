import { IsString, IsOptional, IsArray, IsISO8601, IsBoolean, IsIn, IsNumber, IsUUID, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export type ContentBlock =
  | { type: 'text'; html: string }
  | { type: 'image'; imageId: string; caption?: string; fullWidth?: boolean }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'cta'; label: string; url: string; style?: 'primary' | 'secondary' };

export enum EventTypeEnum {
  WEBINAIRE = 'webinaire',
  DEBAT = 'debat',
  ATELIER = 'atelier',
  FORMATION_DIRECTE = 'formation_directe',
  CONFERENCE = 'conference',
  NETWORKING = 'networking',
}

export enum EventStatusEnum {
  DRAFT = 'draft',
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateEventSpeakerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateEventDto {
  @IsEnum(EventTypeEnum)
  type: EventTypeEnum;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  content?: ContentBlock[];

  @IsISO8601()
  startAt: string;

  @IsISO8601()
  endAt: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsString()
  meetingUrl: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['FR', 'EN', 'BILINGUAL'])
  language?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean = false;

  @IsOptional()
  @IsEnum(EventStatusEnum)
  status?: EventStatusEnum = EventStatusEnum.DRAFT;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventSpeakerDto)
  speakers?: CreateEventSpeakerDto[];
}
