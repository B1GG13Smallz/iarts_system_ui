export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  roles: string[];
}

export type AuthSession = AuthResponse;
