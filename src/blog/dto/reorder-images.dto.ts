import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderImagesDto {
  @ApiProperty({ type: [String], description: 'IDs des images dans le nouvel ordre' })
  @IsArray()
  @IsUUID('4', { each: true })
  order: string[];
}
