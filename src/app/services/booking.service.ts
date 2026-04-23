import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateBookingRequest, BookingResponse } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  createBooking(request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, request);
  }

  getBooking(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/${id}`);
  }

  getUserBookings(userId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/user/${userId}`);
  }

  getActiveBooking(userId: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/user/${userId}/active`);
  }

  getLotBookings(lotId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/lot/${lotId}`);
  }

  checkIn(bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.apiUrl}/${bookingId}/checkin`, {});
  }

  checkOut(bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.apiUrl}/${bookingId}/checkout`, {});
  }

  cancelBooking(bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.apiUrl}/${bookingId}/cancel`, {});
  }
}
