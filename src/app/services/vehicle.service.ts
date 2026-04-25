import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RegisterVehicleRequest,
  UpdateVehicleRequest,
  VehicleResponse,
} from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly apiUrl = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  registerVehicle(request: RegisterVehicleRequest): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(this.apiUrl, request);
  }

  getVehicle(id: number): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.apiUrl}/${id}`);
  }

  getVehiclesByOwner(ownerId: number): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/owner/${ownerId}`);
  }

  getVehicleByPlate(plate: string): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.apiUrl}/plate/${plate}`);
  }

  updateVehicle(id: number, request: UpdateVehicleRequest): Observable<VehicleResponse> {
    return this.http.put<VehicleResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getVehiclesByType(type: string): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/type/${type}`);
  }

  getEVVehicles(isEV: boolean): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/ev/${isEV}`);
  }
}
