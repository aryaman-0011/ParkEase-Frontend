import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { LotService } from '../../services/lot.service';
import { BookingService } from '../../services/booking.service';
import { PaymentService } from '../../services/payment.service';
import { UserResponse } from '../../models/auth.model';
import { UserStatsResponse } from '../../models/admin.model';
import { LotResponse } from '../../models/lot.model';
import { BookingResponse } from '../../models/booking.model';
import { PaymentResponse } from '../../models/payment.model';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  user: UserResponse | null = null;

  // Manager data
  managerLots: LotResponse[] = [];
  managerTotalSpots = 0;
  managerAvailableSpots = 0;

  // Driver data
  activeBooking: BookingResponse | null = null;
  recentBookings: BookingResponse[] = [];
  totalSpent = 0;
  recentPayments: PaymentResponse[] = [];

  // Admin data
  adminStats: UserStatsResponse | null = null;
  pendingCount = 0;
  totalLots = 0;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private lotService: LotService,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.authService.getProfile().subscribe({
      next: (u: UserResponse) => {
        this.user = u;
        this.cdr.detectChanges();
      },
    });

    if (this.user?.role === 'MANAGER') {
      this.loadManagerData();
    }
    if (this.user?.role === 'ADMIN') {
      this.loadAdminData();
    }
    if (this.user?.role === 'DRIVER') {
      this.loadDriverData();
    }
  }

  private loadManagerData(): void {
    this.lotService.getMyLots().subscribe({
      next: (lots: any) => {
        this.managerLots = Array.isArray(lots) ? lots : (lots?.content || []);
        this.managerTotalSpots = this.managerLots.reduce((s: number, l: LotResponse) => s + (l.totalSpots || 0), 0);
        this.managerAvailableSpots = this.managerLots.reduce((s: number, l: LotResponse) => s + (l.availableSpots || 0), 0);
        this.cdr.detectChanges();
      },
    });
  }

  private loadAdminData(): void {
    this.adminService.getStats().subscribe({
      next: (stats: UserStatsResponse) => {
        this.adminStats = stats;
        this.cdr.detectChanges();
      },
    });
    this.lotService.getPendingLots().subscribe({
      next: (lots: LotResponse[]) => {
        this.pendingCount = lots.length;
        this.cdr.detectChanges();
      },
    });
    this.lotService.getAllLots().subscribe({
      next: (lots: LotResponse[]) => {
        this.totalLots = lots.length;
        this.cdr.detectChanges();
      },
    });
  }

  private loadDriverData(): void {
    if (!this.user) return;
    this.bookingService.getActiveBooking(this.user.id).subscribe({
      next: (b: BookingResponse) => {
        this.activeBooking = b;
        this.cdr.detectChanges();
      },
      error: () => { this.activeBooking = null; },
    });
    this.bookingService.getUserBookings(this.user.id).subscribe({
      next: (bookings: BookingResponse[]) => {
        this.recentBookings = bookings.slice(0, 5);
        this.cdr.detectChanges();
      },
    });
    this.paymentService.getTotalSpent(this.user.id).subscribe({
      next: (res: { userId: number; totalSpent: number }) => {
        this.totalSpent = res.totalSpent;
        this.cdr.detectChanges();
      },
    });
    this.paymentService.getUserPayments(this.user.id).subscribe({
      next: (payments: PaymentResponse[]) => {
        this.recentPayments = payments.slice(0, 5);
        this.cdr.detectChanges();
      },
    });
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getFirstName(): string {
    return this.user?.fullName?.split(' ')[0] || '';
  }

  getOccupancyRate(): number {
    if (this.managerTotalSpots === 0) return 0;
    return Math.round(((this.managerTotalSpots - this.managerAvailableSpots) / this.managerTotalSpots) * 100);
  }

  getOpenLots(): number {
    return this.managerLots.filter((l: LotResponse) => l.approved && l.open).length;
  }

  getInitials(): string {
    return (this.user?.fullName || '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
