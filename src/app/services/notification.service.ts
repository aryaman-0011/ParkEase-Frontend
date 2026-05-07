import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification, UnreadCountResponse } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();
  private pollingStarted = false;

  constructor(private http: HttpClient) {}

  getNotifications(recipientId: number): Observable<Notification[]> {
    console.log('[NotifService] getNotifications for recipientId:', recipientId);
    return this.http.get<Notification[]>(`${this.apiUrl}/recipient/${recipientId}`).pipe(
      tap((data) => console.log('[NotifService] getNotifications response:', data)),
      catchError((err) => {
        console.error('[NotifService] getNotifications ERROR:', err);
        return of([]);
      })
    );
  }

  getUnreadCount(recipientId: number): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count/${recipientId}`).pipe(
      tap((res) => {
        console.log('[NotifService] unreadCount:', res.count);
        this.unreadCountSubject.next(res.count);
      }),
      catchError((err) => {
        console.error('[NotifService] getUnreadCount ERROR:', err);
        return of({ count: 0 });
      })
    );
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllRead(recipientId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all/${recipientId}`, {});
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  startPolling(recipientId: number): void {
    if (this.pollingStarted) return;
    this.pollingStarted = true;
    interval(30000).pipe(
      switchMap(() => this.getUnreadCount(recipientId))
    ).subscribe();
  }
}
