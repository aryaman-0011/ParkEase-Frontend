import { Component, OnInit, OnDestroy, Input, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';
import { UserResponse } from '../../models/auth.model';
import { Notification } from '../../models/notification.model';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() activePage: string = 'home';
  user: UserResponse | null = null;
  unreadCount: number = 0;
  showNotifDropdown = false;
  notifications: Notification[] = [];
  loadingNotifs = false;
  isDark = true;
  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private notifService: NotificationService,
    private themeService: ThemeService,
    private elRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    this.subs.push(
      this.auth.currentUser$.subscribe((u) => {
        if (u) this.user = u;
      })
    );

    this.subs.push(
      this.notifService.unreadCount$.subscribe((c) => {
        this.unreadCount = c;
        this.cdr.detectChanges();
      })
    );

    if (this.user) {
      this.notifService.getUnreadCount(this.user.id).subscribe();
      this.notifService.startPolling(this.user.id);
    }

    this.subs.push(
      this.themeService.theme$.subscribe((t) => {
        this.isDark = t === 'dark';
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  toggleNotifDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown && this.user) {
      this.loadingNotifs = true;
      this.cdr.detectChanges();
      this.notifService.getNotifications(this.user.id).subscribe({
        next: (data) => {
          this.notifications = data || [];
          this.loadingNotifs = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications = [];
          this.loadingNotifs = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showNotifDropdown && !this.elRef.nativeElement.contains(event.target)) {
      this.showNotifDropdown = false;
    }
  }

  markAsRead(n: Notification, event: Event): void {
    event.stopPropagation();
    if (!n.read) {
      this.notifService.markAsRead(n.id).subscribe(() => {
        n.read = true;
        if (this.user) this.notifService.getUnreadCount(this.user.id).subscribe();
        this.cdr.detectChanges();
      });
    }
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    if (this.user) {
      this.notifService.markAllRead(this.user.id).subscribe(() => {
        this.notifications.forEach((n) => (n.read = true));
        if (this.user) this.notifService.getUnreadCount(this.user.id).subscribe();
        this.cdr.detectChanges();
      });
    }
  }

  deleteNotif(id: number, event: Event): void {
    event.stopPropagation();
    this.notifService.deleteNotification(id).subscribe(() => {
      this.notifications = this.notifications.filter((n) => n.id !== id);
      if (this.user) this.notifService.getUnreadCount(this.user.id).subscribe();
      this.cdr.detectChanges();
    });
  }

  viewAll(): void {
    this.showNotifDropdown = false;
    this.router.navigate(['/notifications']);
  }

  getIconName(type: string): string {
    const icons: Record<string, string> = {
      BOOKING: 'confirmation_number',
      CHECKIN: 'check_circle',
      CHECKOUT: 'logout',
      PAYMENT: 'credit_card',
      EXPIRY: 'schedule',
      LOT_APPROVED: 'verified',
      LOT_REJECTED: 'cancel',
      BOOKING_RECEIVED: 'inbox',
      NEW_LOT_PENDING: 'pending',
      PROMO: 'campaign',
      BROADCAST: 'campaign',
    };
    return icons[type] || 'notifications';
  }

  getIconColor(type: string): string {
    const colors: Record<string, string> = {
      BOOKING: '#a78bfa',
      CHECKIN: '#34d399',
      CHECKOUT: '#60a5fa',
      PAYMENT: '#fbbf24',
      EXPIRY: '#f87171',
      LOT_APPROVED: '#34d399',
      LOT_REJECTED: '#f87171',
      BOOKING_RECEIVED: '#60a5fa',
      NEW_LOT_PENDING: '#fbbf24',
      PROMO: '#c084fc',
      BROADCAST: '#f472b6',
    };
    return colors[type] || '#a78bfa';
  }

  getTimeAgo(sentAt: string): string {
    const diff = Date.now() - new Date(sentAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  getInitials(): string {
    if (!this.user?.fullName) return '?';
    return this.user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarUrl(): string | null {
    if (!this.user?.profilePicUrl) return null;
    if (this.user.profilePicUrl.startsWith('http')) return this.user.profilePicUrl;
    return `${environment.apiUrl}${this.user.profilePicUrl}`;
  }

  getFirstName(): string {
    return this.user?.fullName?.split(' ')[0] || '';
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
