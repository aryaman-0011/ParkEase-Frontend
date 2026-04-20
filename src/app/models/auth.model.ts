export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'DRIVER' | 'MANAGER' | 'ADMIN';
  vehiclePlate?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  profilePicUrl?: string;
  vehiclePlate?: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  vehiclePlate: string | null;
  provider: string;
  active: boolean;
  profilePicUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface ApiMessageResponse {
  message: string;
}
