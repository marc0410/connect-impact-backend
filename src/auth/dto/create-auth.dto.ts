import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Length, IsNumberString } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // email OU username

  @IsString()
  @Length(6, 6)
  password: string; // 6 chiffres
}

export class CreateStaffAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsEnum(['responsable', 'blog_manager', 'admin'])
  role: 'responsable' | 'blog_manager' | 'admin';

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class ActivateAccountDto {
  @IsString()
  token: string;

  @IsEmail()
  email: string;

  @IsNumberString()
  @Length(6, 6)
  password: string; // 6 chiffres (choisi par l'utilisateur)
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Length(6, 6)
  newPassword: string; // 6 chiffres
}
