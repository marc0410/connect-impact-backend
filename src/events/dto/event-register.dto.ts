import { IsString, IsOptional, IsEmail, IsArray, IsBoolean } from 'class-validator';

export class EventRegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class EventUnregisterDto {
  @IsString()
  registrationId: string;
}

export class UpdateAttendanceDto {
  @IsArray()
  @IsString({ each: true })
  registrationIds: string[];

  @IsBoolean()
  attended: boolean;
}
