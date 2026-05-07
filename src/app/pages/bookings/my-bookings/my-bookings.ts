import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { BookingResponse } from '../../../models/booking.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookingsComponent implements OnInit {
  bookings: BookingResponse[] = [];
  loading = true;
  filterStatus: string = 'ALL';

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.loadBookings(user.id);
  }

  loadBookings(userId: number): void {
    this.loading = true;
    this.bookingService.getUserBookings(userId).subscribe({
      next: (bookings: BookingResponse[]) => {
        this.bookings = bookings.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredBookings(): BookingResponse[] {
    if (this.filterStatus === 'ALL') return this.bookings;
    return this.bookings.filter(b => b.status === this.filterStatus);
  }

  get activeCount(): number {
    return this.bookings.filter(b => b.status === 'ACTIVE' || b.status === 'RESERVED').length;
  }

  get completedCount(): number {
    return this.bookings.filter(b => b.status === 'COMPLETED').length;
  }

  get cancelledCount(): number {
    return this.bookings.filter(b => b.status === 'CANCELLED').length;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'RESERVED': return 'status-reserved';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  getDuration(b: BookingResponse): string {
    const start = new Date(b.scheduledStartTime);
    const end = new Date(b.scheduledEndTime);
    const diffMs = end.getTime() - start.getTime();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  formatShortDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
