import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  MinLength,
  MaxLength,
  ValidateNested,
  Min,
  Max,
  IsIn,
  IsNumberString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Availability,
} from '@prisma/client';

class IdentityDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  @IsIn(['M', 'F', 'homme', 'femme', 'non_binaire', 'prefere_ne_pas_dire'])
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;
}

class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

class BackgroundDto {
  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsString()
  currentEmploymentStatus?: string;

  @IsOptional()
  @IsBoolean()
  hasVolunteeredBefore?: boolean;

  @IsOptional()
  @IsString()
  previousExperience?: string;
}

class MotivationDto {
  @IsString()
  @MinLength(100)
  @MaxLength(2000)
  motivationLetter: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

class AvailabilityDto {
  @IsEnum(Availability)
  type: Availability;

  @IsOptional()
  @Min(1)
  @Max(40)
  hoursPerWeek?: number;
}

class SocialLinksDto {
  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  portfolio?: string;
}

class ProfileDto {
  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsBoolean()
  isOpenToOpportunities?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;
}

class ConsentsDto {
  @IsBoolean()
  @IsNotEmpty()
  agreesToStatutes: boolean;

  @IsBoolean()
  @IsNotEmpty()
  agreesToPrivacyPolicy: boolean;

  @IsBoolean()
  @IsNotEmpty()
  agreesToCodeOfConduct: boolean;
}

export class SubmitMembershipDto {
  @ValidateNested()
  @Type(() => IdentityDto)
  identity: IdentityDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BackgroundDto)
  background?: BackgroundDto;

  @ValidateNested()
  @Type(() => MotivationDto)
  motivation: MotivationDto;

  @ValidateNested()
  @Type(() => AvailabilityDto)
  availability: AvailabilityDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;

  @ValidateNested()
  @Type(() => ConsentsDto)
  consents: ConsentsDto;

  @IsNumberString()
  @Length(6, 6)
  password: string; // code 6 chiffres

  @IsNumberString()
  @Length(6, 6)
  passwordConfirm: string; // confirmation du code
}
