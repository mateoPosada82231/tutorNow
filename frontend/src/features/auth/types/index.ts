export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  carreraId: number;
  semestreId: number;
}

export interface RegisterResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  requiresVerification: boolean;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface MessageResponse {
  message: string;
}

export interface CatalogItem {
  id: number;
  label: string;
}
