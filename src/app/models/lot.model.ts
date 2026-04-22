export interface CreateLotRequest {
  name: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  pricePerHour: number;
  imageUrl?: string;
  description?: string;
}

export interface UpdateLotRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  pricePerHour?: number;
  imageUrl?: string;
  description?: string;
}

export interface LotResponse {
  id: number;
  managerId: number;
  name: string;
  address: string;
  city: string;
  state: string | null;
  zipCode: string | null;
  latitude: number;
  longitude: number;
  totalSpots: number;
  availableSpots: number;
  pricePerHour: number;
  approved: boolean;
  open: boolean;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  distanceKm: number | null;
}

export interface ApiMessageResponse {
  message: string;
}
