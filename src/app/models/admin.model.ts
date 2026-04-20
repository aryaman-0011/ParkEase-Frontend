export interface UserPageResponse {
  content: AdminUserResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminUserResponse {
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

export interface UserStatsResponse {
  totalUsers: number;
  totalDrivers: number;
  totalManagers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface AdminUpdateUserRequest {
  role: 'DRIVER' | 'MANAGER' | 'ADMIN';
}
