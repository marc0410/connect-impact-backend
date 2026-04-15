import { PickType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class SubmitPostDto extends PickType(CreatePostDto, [
  'type',
  'title',
  'slug',
  'excerpt',
  'description',
  'category',
  'domain',
  'opportunityData',
  'bonplanData',
  'resourceData',
] as const) {}
