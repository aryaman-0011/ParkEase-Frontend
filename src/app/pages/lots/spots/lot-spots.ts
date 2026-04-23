import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SpotService } from '../../../services/spot.service';
import { LotService } from '../../../services/lot.service';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { SpotResponse, SpotCountResponse, SpotType } from '../../../models/spot.model';
import { LotResponse } from '../../../models/lot.model';
import { BookingResponse } from '../../../models/booking.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-lot-spots',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './lot-spots.html',
  styleUrl: './lot-spots.css',
})
export class LotSpotsComponent implements OnInit {
  lotId!: number;
  lot: LotResponse | null = null;
  spots: SpotResponse[] = [];
  counts: SpotCountResponse | null = null;
  loading = true;
  filterType: string = 'ALL';

  // Booking
  activeBooking: BookingResponse | null = null;
  bookingLoading = false;
  bookingMessage = '';
  bookingError = '';

  spotTypes: SpotType[] = ['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'];

  constructor(
    private spotService: SpotService,
    private lotService: LotService,
    private bookingService: BookingService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.lotId = Number(this.route.snapshot.paramMap.get('lotId'));
    this.loadLot();
    this.loadSpots();
    this.loadActiveBooking();
  }

  loadLot(): void {
    this.lotService.getLotById(this.lotId).subscribe({
      next: (lot: LotResponse) => {
        this.lot = lot;
        this.cdr.detectChanges();
      },
    });
  }

  loadSpots(): void {
    this.loading = true;
    this.spotService.getSpotsByLot(this.lotId).subscribe({
      next: (spots: SpotResponse[]) => {
        this.spots = spots;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
    this.spotService.getSpotCounts(this.lotId).subscribe({
      next: (counts: SpotCountResponse) => {
        this.counts = counts;
        this.cdr.detectChanges();
      },
    });
  }

  loadActiveBooking(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.bookingService.getActiveBooking(user.id).subscribe({
      next: (b: BookingResponse) => {
        this.activeBooking = b;
        this.cdr.detectChanges();
      },
      error: () => {
        this.activeBooking = null;
        this.cdr.detectChanges();
      },
    });
  }

  bookSpot(spot: SpotResponse): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.bookingError = 'You must be logged in.'; return; }
    if (this.activeBooking) {
      this.bookingError = 'You already have an active booking. Cancel or complete it first.';
      return;
    }
    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingMessage = '';
    this.bookingService.createBooking({
      userId: user.id,
      spotId: spot.spotId,
      lotId: this.lotId,
      vehiclePlate: user.vehiclePlate || undefined,
    }).subscribe({
      next: (b: BookingResponse) => {
        this.activeBooking = b;
        this.bookingMessage = `Spot ${b.spotNumber} booked! Check in when you arrive.`;
        this.bookingLoading = false;
        this.loadSpots();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err: any) => {
        this.bookingError = err.error?.message || 'Booking failed.';
        this.bookingLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingError = ''; this.cdr.detectChanges(); }, 5000);
      },
    });
  }

  checkIn(): void {
    if (!this.activeBooking) return;
    this.bookingLoading = true;
    this.bookingService.checkIn(this.activeBooking.bookingId).subscribe({
      next: (b: BookingResponse) => {
        this.activeBooking = b;
        this.bookingMessage = 'Checked in! Enjoy your parking.';
        this.bookingLoading = false;
        this.loadSpots();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err: any) => {
        this.bookingError = err.error?.message || 'Check-in failed.';
        this.bookingLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  checkOut(): void {
    if (!this.activeBooking) return;
    this.bookingLoading = true;
    this.bookingService.checkOut(this.activeBooking.bookingId).subscribe({
      next: (b: BookingResponse) => {
        this.activeBooking = null;
        this.bookingMessage = `Checked out! Total: ₹${b.totalCost?.toFixed(2)}`;
        this.bookingLoading = false;
        this.loadSpots();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 8000);
      },
      error: (err: any) => {
        this.bookingError = err.error?.message || 'Check-out failed.';
        this.bookingLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cancelBooking(): void {
    if (!this.activeBooking) return;
    this.bookingLoading = true;
    this.bookingService.cancelBooking(this.activeBooking.bookingId).subscribe({
      next: () => {
        this.activeBooking = null;
        this.bookingMessage = 'Booking cancelled.';
        this.bookingLoading = false;
        this.loadSpots();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err: any) => {
        this.bookingError = err.error?.message || 'Cancel failed.';
        this.bookingLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredSpots(): SpotResponse[] {
    if (this.filterType === 'ALL') return this.spots;
    return this.spots.filter((s) => s.spotType === this.filterType);
  }

  getSpotTypeIcon(type: string): string {
    switch (type) {
      case 'COMPACT': return '🚗';
      case 'STANDARD': return '🚙';
      case 'LARGE': return '🚐';
      case 'MOTORBIKE': return '🏍️';
      case 'EV': return '⚡';
      default: return '🅿️';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'TWO_WHEELER': return '2-Wheeler';
      case 'FOUR_WHEELER': return '4-Wheeler';
      case 'HEAVY': return 'Heavy';
      default: return type;
    }
  }
}
