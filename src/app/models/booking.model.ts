export interface CreateBookingRequest {
  userId: number;
  spotId: number;
  lotId: number;
  vehicleId?: number;
  vehiclePlate?: string;
  scheduledStartTime: string; // ISO datetime
  scheduledEndTime: string;   // ISO datetime
}

export interface ExtendBookingRequest {
  newEndTime: string; // ISO datetime
}

export interface BookingResponse {
  bookingId: number;
  userId: number;
  spotId: number;
  lotId: number;
  lotName: string;
  spotNumber: string;
  vehiclePlate: string;
  vehicleId: number | null;
  status: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledStartTime: string;
  scheduledEndTime: string;
  startTime: string | null;
  endTime: string | null;
  pricePerHour: number;
  totalCost: number | null;
  createdAt: string;
  updatedAt: string;
}
