import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffAccountDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(CreateStaffAccountDto) {}
