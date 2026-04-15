import { IsOptional, IsIn, Min, Max, IsString, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class EventsQueryDto {
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @Min(1)
  @Max(50)
  perPage?: number = 12;

  @IsOptional()
  @IsIn(['webinaire', 'debat', 'atelier', 'formation_directe', 'conference', 'networking'])
  type?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIn(['draft', 'upcoming', 'ongoing', 'completed', 'cancelled', 'all'])
  status?: string = 'upcoming,ongoing';

  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: string;

  @IsOptional()
  @IsString()
  sort?: string = 'startAt:asc';
}
