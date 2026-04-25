export interface RegisterVehicleRequest {
  ownerId: number;
  licensePlate: string;
  make: string;
  model: string;
  color?: string;
  vehicleType: string; // 2W, 4W, HEAVY
  isEV?: boolean;
}

export interface UpdateVehicleRequest {
  make?: string;
  model?: string;
  color?: string;
  vehicleType?: string;
  isEV?: boolean;
  isActive?: boolean;
}

export interface VehicleResponse {
  vehicleId: number;
  ownerId: number;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  vehicleType: string;
  isEV: boolean;
  registeredAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
