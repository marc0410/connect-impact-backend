export class LoginResponseDto {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}
