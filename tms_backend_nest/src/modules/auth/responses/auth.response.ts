export class AuthTokenResponseDto {
  accessToken!: string;
  refreshToken?: string;
  expiresIn!: number;
  tokenType: string = 'Bearer';
}

export class LoginResponseDto {
  token!: AuthTokenResponseDto;
  user!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export class RegisterResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  message!: string;
}
