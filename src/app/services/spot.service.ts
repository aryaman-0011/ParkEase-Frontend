import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateSpotRequest,
  BulkCreateSpotRequest,
  UpdateSpotRequest,
  SpotResponse,
  SpotCountResponse,
  SpotType,
  VehicleType,
} from '../models/spot.model';
import { ApiMessageResponse } from '../models/lot.model';

@Injectable({ providedIn: 'root' })
export class SpotService {
  private readonly apiUrl = `${environment.apiUrl}/spots`;

  constructor(private http: HttpClient) {}

  /* ───── Create ───── */

  addSpot(request: CreateSpotRequest): Observable<SpotResponse> {
    return this.http.post<SpotResponse>(this.apiUrl, request);
  }

  addBulkSpots(request: BulkCreateSpotRequest): Observable<SpotResponse[]> {
    return this.http.post<SpotResponse[]>(`${this.apiUrl}/bulk`, request);
  }

  /* ───── Read ───── */

  getSpotById(spotId: number): Observable<SpotResponse> {
    return this.http.get<SpotResponse>(`${this.apiUrl}/${spotId}`);
  }

  getSpotsByLot(lotId: number): Observable<SpotResponse[]> {
    return this.http.get<SpotResponse[]>(`${this.apiUrl}/lot/${lotId}`);
  }

  getAvailableSpots(lotId: number): Observable<SpotResponse[]> {
    return this.http.get<SpotResponse[]>(`${this.apiUrl}/lot/${lotId}/available`);
  }

  getSpotsByType(lotId: number, spotType: SpotType): Observable<SpotResponse[]> {
    return this.http.get<SpotResponse[]>(`${this.apiUrl}/lot/${lotId}/type/${spotType}`);
  }

  getSpotsByVehicleType(lotId: number, vehicleType: VehicleType): Observable<SpotResponse[]> {
    return this.http.get<SpotResponse[]>(`${this.apiUrl}/lot/${lotId}/vehicle/${vehicleType}`);
  }

  getSpotCounts(lotId: number): Observable<SpotCountResponse> {
    return this.http.get<SpotCountResponse>(`${this.apiUrl}/lot/${lotId}/count`);
  }

  /* ───── Update ───── */

  updateSpot(spotId: number, request: UpdateSpotRequest): Observable<SpotResponse> {
    return this.http.put<SpotResponse>(`${this.apiUrl}/${spotId}`, request);
  }

  reserveSpot(spotId: number): Observable<SpotResponse> {
    return this.http.put<SpotResponse>(`${this.apiUrl}/${spotId}/reserve`, {});
  }

  occupySpot(spotId: number): Observable<SpotResponse> {
    return this.http.put<SpotResponse>(`${this.apiUrl}/${spotId}/occupy`, {});
  }

  releaseSpot(spotId: number): Observable<SpotResponse> {
    return this.http.put<SpotResponse>(`${this.apiUrl}/${spotId}/release`, {});
  }

  /* ───── Delete ───── */

  deleteSpot(spotId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/${spotId}`);
  }

  deleteAllSpotsByLot(lotId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/lot/${lotId}`);
  }
}
