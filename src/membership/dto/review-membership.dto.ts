import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { MembershipType } from '@prisma/client';

export class ReviewMembershipDto {
  @IsOptional()
  @IsEnum(['approved', 'rejected', 'suspended'])
  status?: 'approved' | 'rejected' | 'suspended';

  @IsOptional()
  @IsEnum(MembershipType)
  membershipType?: MembershipType;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}
