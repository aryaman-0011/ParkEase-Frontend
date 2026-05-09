import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private base = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getOccupancyRate(lotId: number): Observable<any> {
    return this.http.get(`${this.base}/occupancyRate`, { params: { lotId } });
  }

  getOccupancyByHour(lotId: number): Observable<any> {
    return this.http.get(`${this.base}/byHour`, { params: { lotId } });
  }

  getPeakHours(lotId: number): Observable<any> {
    return this.http.get(`${this.base}/peakHours`, { params: { lotId } });
  }

  getRevenue(lotId: number): Observable<any> {
    return this.http.get(`${this.base}/revenue`, { params: { lotId } });
  }

  getRevenueByDay(lotId: number, from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/revenueByDay`, { params: { lotId, from, to } });
  }

  getSpotTypes(lotId: number): Observable<any> {
    return this.http.get(`${this.base}/spotTypes`, { params: { lotId } });
  }

  getAvgDuration(lotId: number): Observable<any> {
    return this.http.get(`${this.base}/avgDuration`, { params: { lotId } });
  }

  getPlatformSummary(): Observable<any> {
    return this.http.get(`${this.base}/platformSummary`);
  }

  getDailyReport(lotId: number): Observable<any> {
    return this.http.get(`${this.base}/dailyReport`, { params: { lotId } });
  }

  logOccupancy(payload: any): Observable<any> {
    return this.http.post(`${this.base}/log`, payload);
  }
}
