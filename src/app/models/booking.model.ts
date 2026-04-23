export interface CreateBookingRequest {
  userId: number;
  spotId: number;
  lotId: number;
  vehiclePlate?: string;
}

export interface BookingResponse {
  bookingId: number;
  userId: number;
  spotId: number;
  lotId: number;
  lotName: string;
  spotNumber: string;
  vehiclePlate: string;
  status: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  endTime: string | null;
  pricePerHour: number;
  totalCost: number | null;
  createdAt: string;
  updatedAt: string;
}
