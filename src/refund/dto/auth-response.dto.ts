export class AuthResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user?: {
    id: string;
    email: string;
    name: string;
    userType?: string;
  };
  customer?: {
    id: string;
    email: string;
    name: string;
    phone: string;
  };
}

