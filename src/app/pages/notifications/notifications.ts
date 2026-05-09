import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Notification } from '../../models/notification.model';
import { Subscription } from 'rxjs';

interface Category {
  key: string;
  label: string;
  icon: string;
  types: string[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  displayedNotifications: Notification[] = [];
  loading = true;
  errorMsg = '';
  userId: number = 0;
  userRole: string = '';
  activeCategory = 'all';
  categories: Category[] = [];
  expandedId: number | null = null;
  private sub?: Subscription;

  private roleCategories: Record<string, Category[]> = {
    DRIVER: [
      { key: 'all', label: 'All', icon: 'all', types: [] },
      { key: 'bookings', label: 'Bookings', icon: 'booking', types: ['BOOKING', 'CHECKIN', 'CHECKOUT', 'EXPIRY'] },
      { key: 'payments', label: 'Payments', icon: 'payment', types: ['PAYMENT'] },
      { key: 'system', label: 'System', icon: 'system', types: ['PROMO'] },
    ],
    MANAGER: [
      { key: 'all', label: 'All', icon: 'all', types: [] },
      { key: 'bookings', label: 'Bookings', icon: 'inbox', types: ['BOOKING_RECEIVED'] },
      { key: 'lots', label: 'My Lots', icon: 'lot', types: ['LOT_APPROVED', 'LOT_REJECTED'] },
      { key: 'system', label: 'System', icon: 'system', types: ['PROMO'] },
    ],
    ADMIN: [
      { key: 'all', label: 'All', icon: 'all', types: [] },
      { key: 'lots', label: 'Lot Requests', icon: 'lot', types: ['NEW_LOT_PENDING'] },
      { key: 'system', label: 'System', icon: 'system', types: ['PROMO'] },
    ],
  };

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = user.id;
      this.userRole = user.role || 'DRIVER';
      this.categories = this.roleCategories[this.userRole] || this.roleCategories['DRIVER'];
      this.loadNotifications();
    } else {
      this.loading = false;
      this.errorMsg = 'Please log in to view notifications';
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.sub = this.notificationService.getNotifications(this.userId).subscribe({
      next: (data) => {
        console.log('[NotifPage] received data:', data);
        this.notifications = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
        this.notificationService.getUnreadCount(this.userId).subscribe();
      },
      error: (err) => {
        console.error('[NotifPage] ERROR loading notifications:', err);
        this.notifications = [];
        this.displayedNotifications = [];
        this.loading = false;
        this.errorMsg = 'Failed to load notifications. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  applyFilter(): void {
    if (this.activeCategory === 'all') {
      this.displayedNotifications = [...this.notifications];
    } else {
      const cat = this.categories.find((c) => c.key === this.activeCategory);
      this.displayedNotifications = cat
        ? this.notifications.filter((n) => cat.types.includes(n.type))
        : [...this.notifications];
    }
  }

  get unreadCount(): number {
    return this.displayedNotifications.filter((n) => !n.read).length;
  }

  setCategory(key: string): void {
    this.activeCategory = key;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  getCategoryCount(cat: Category): number {
    if (cat.key === 'all') return this.notifications.length;
    return this.notifications.filter((n) => cat.types.includes(n.type)).length;
  }

  toggleExpand(notification: Notification): void {
    this.expandedId = this.expandedId === notification.id ? null : notification.id;
    this.cdr.detectChanges();
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.applyFilter();
        this.cdr.detectChanges();
        this.notificationService.getUnreadCount(this.userId).subscribe();
      });
    }
  }

  markAllRead(): void {
    this.notificationService.markAllRead(this.userId).subscribe(() => {
      this.notifications.forEach((n) => (n.read = true));
      this.applyFilter();
      this.cdr.detectChanges();
      this.notificationService.getUnreadCount(this.userId).subscribe();
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe(() => {
      this.notifications = this.notifications.filter((n) => n.id !== id);
      this.applyFilter();
      this.cdr.detectChanges();
      this.notificationService.getUnreadCount(this.userId).subscribe();
    });
  }

  getCatIconName(icon: string): string {
    const icons: Record<string, string> = {
      all: 'notifications',
      booking: 'confirmation_number',
      payment: 'credit_card',
      inbox: 'inbox',
      lot: 'domain',
      system: 'campaign',
    };
    return icons[icon] || 'notifications';
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

  formatType(type: string): string {
    return type.replace(/_/g, ' ');
  }
}
