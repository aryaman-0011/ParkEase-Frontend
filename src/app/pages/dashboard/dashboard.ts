import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { LotService } from '../../services/lot.service';
import { UserResponse } from '../../models/auth.model';
import { UserStatsResponse } from '../../models/admin.model';
import { LotResponse } from '../../models/lot.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  user: UserResponse | null = null;

  // Manager data
  managerLots: LotResponse[] = [];
  managerTotalSpots = 0;
  managerAvailableSpots = 0;

  // Admin data
  adminStats: UserStatsResponse | null = null;
  pendingCount = 0;
  totalLots = 0;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private lotService: LotService,
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
