export interface CreateSpotRequest {
  lotId: number;
  spotNumber: string;
  floor?: number;
  spotType: SpotType;
  vehicleType: VehicleType;
  isHandicapped?: boolean;
  isEVCharging?: boolean;
  pricePerHour?: number;
}

export interface BulkCreateSpotRequest {
  lotId: number;
  spotType: SpotType;
  vehicleType: VehicleType;
  floor?: number;
  count: number;
  prefix?: string;
  startFrom?: number;
  isHandicapped?: boolean;
  isEVCharging?: boolean;
  pricePerHour?: number;
}

export interface UpdateSpotRequest {
  spotNumber?: string;
  floor?: number;
  spotType?: SpotType;
  vehicleType?: VehicleType;
  isHandicapped?: boolean;
  isEVCharging?: boolean;
  pricePerHour?: number;
}

export interface SpotResponse {
  spotId: number;
  lotId: number;
  spotNumber: string;
  floor: number;
  spotType: SpotType;
  vehicleType: VehicleType;
  status: SpotStatus;
  isHandicapped: boolean;
  isEVCharging: boolean;
  pricePerHour: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpotCountResponse {
  lotId: number;
  total: number;
  available: number;
  reserved: number;
  occupied: number;
}

export type SpotType = 'COMPACT' | 'STANDARD' | 'LARGE' | 'MOTORBIKE' | 'EV';
export type VehicleType = 'TWO_WHEELER' | 'FOUR_WHEELER' | 'HEAVY';
export type SpotStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
