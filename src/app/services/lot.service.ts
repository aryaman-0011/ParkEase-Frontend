import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateLotRequest,
  UpdateLotRequest,
  LotResponse,
  ApiMessageResponse,
} from '../models/lot.model';

@Injectable({ providedIn: 'root' })
export class LotService {
  private readonly apiUrl = `${environment.apiUrl}/lots`;

  constructor(private http: HttpClient) {}

  /* ───── Manager ───── */

  createLot(request: CreateLotRequest): Observable<LotResponse> {
    return this.http.post<LotResponse>(this.apiUrl, request);
  }

  updateLot(id: number, request: UpdateLotRequest): Observable<LotResponse> {
    return this.http.put<LotResponse>(`${this.apiUrl}/${id}`, request);
  }

  toggleOpenClose(id: number): Observable<LotResponse> {
    return this.http.put<LotResponse>(`${this.apiUrl}/${id}/toggle`, {});
  }

  getMyLots(): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.apiUrl}/manager`);
  }

  deleteLot(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/${id}`);
  }

  /* ───── Driver / Guest ───── */

  searchByCity(city: string): Observable<LotResponse[]> {
    const params = new HttpParams().set('city', city);
    return this.http.get<LotResponse[]>(`${this.apiUrl}/search`, { params });
  }

  findNearbyLots(lat: number, lng: number, radius = 10): Observable<LotResponse[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString());
    return this.http.get<LotResponse[]>(`${this.apiUrl}/nearby`, { params });
  }

  getLotById(id: number): Observable<LotResponse> {
    return this.http.get<LotResponse>(`${this.apiUrl}/${id}`);
  }

  getAllApprovedLots(): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(this.apiUrl);
  }

  /* ───── Admin ───── */

  getPendingLots(): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.apiUrl}/pending`);
  }

  approveLot(id: number): Observable<LotResponse> {
    return this.http.put<LotResponse>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectLot(id: number): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(`${this.apiUrl}/${id}/reject`, {});
  }

  getAllLots(): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.apiUrl}/all`);
  }

  getLotsByManagerId(managerId: number): Observable<LotResponse[]> {
    return this.http.get<LotResponse[]>(`${this.apiUrl}/by-manager/${managerId}`);
  }

  deleteLotAsAdmin(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/${id}/admin`);
  }
}
