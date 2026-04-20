import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  UserPageResponse,
  AdminUserResponse,
  UserStatsResponse,
  AdminUpdateUserRequest,
} from '../models/admin.model';
import { ApiMessageResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/auth/admin`;

  constructor(private http: HttpClient) {}

  getUsers(
    page = 0,
    size = 10,
    search?: string,
    role?: string
  ): Observable<UserPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<UserPageResponse>(`${this.apiUrl}/users`, { params });
  }

  getUserById(id: number): Observable<AdminUserResponse> {
    return this.http.get<AdminUserResponse>(`${this.apiUrl}/users/${id}`);
  }

  updateUserRole(
    id: number,
    request: AdminUpdateUserRequest
  ): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(
      `${this.apiUrl}/users/${id}/role`,
      request
    );
  }

  suspendUser(id: number): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(
      `${this.apiUrl}/users/${id}/suspend`,
      {}
    );
  }

  activateUser(id: number): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(
      `${this.apiUrl}/users/${id}/activate`,
      {}
    );
  }

  deleteUser(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      `${this.apiUrl}/users/${id}`
    );
  }

  getStats(): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/stats`);
  }
}
