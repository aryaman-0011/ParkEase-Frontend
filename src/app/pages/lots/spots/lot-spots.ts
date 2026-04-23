import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SpotService } from '../../../services/spot.service';
import { LotService } from '../../../services/lot.service';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { PaymentService } from '../../../services/payment.service';
import { SpotResponse, SpotCountResponse, SpotType } from '../../../models/spot.model';
import { LotResponse } from '../../../models/lot.model';
import { BookingResponse } from '../../../models/booking.model';
import { PaymentResponse, RazorpayOrderResponse } from '../../../models/payment.model';
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

  // Payment method modal
  showPaymentModal = false;
  pendingSpot: SpotResponse | null = null;

  // Payment receipt
  lastReceipt: PaymentResponse | null = null;

  spotTypes: SpotType[] = ['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'];

  constructor(
    private spotService: SpotService,
    private lotService: LotService,
    private bookingService: BookingService,
    private authService: AuthService,
    private paymentService: PaymentService,
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

  private showError(msg: string): void {
    this.bookingError = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.bookingError = ''; this.cdr.detectChanges(); }, 6000);
  }

  bookSpot(spot: SpotResponse): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.showError('You must be logged in.'); return; }
    if (this.activeBooking) {
      this.showError('You already have an active booking. Cancel or complete it first.');
      return;
    }
    this.pendingSpot = spot;
    this.showPaymentModal = true;
    this.cdr.detectChanges();
  }

  dismissPaymentModal(): void {
    this.showPaymentModal = false;
    this.pendingSpot = null;
    this.cdr.detectChanges();
  }

  bookWithCash(): void {
    if (!this.pendingSpot) return;
    const spot = this.pendingSpot;
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.showPaymentModal = false;
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
        this.pendingSpot = null;
        this.bookingMessage = `Spot ${b.spotNumber} booked! Pay ₹${spot.pricePerHour}/hr in cash at exit.`;
        this.bookingLoading = false;
        this.loadSpots();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err: any) => {
        this.pendingSpot = null;
        this.bookingLoading = false;
        this.showError(err.error?.message || 'Booking failed.');
      },
    });
  }

  async bookWithOnline(): Promise<void> {
    if (!this.pendingSpot) return;
    const spot = this.pendingSpot;
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.showPaymentModal = false;
    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingMessage = '';

    // Step 1: Create booking
    this.bookingService.createBooking({
      userId: user.id,
      spotId: spot.spotId,
      lotId: this.lotId,
      vehiclePlate: user.vehiclePlate || undefined,
    }).subscribe({
      next: (b: BookingResponse) => {
        this.activeBooking = b;
        this.pendingSpot = null;
        const amount = spot.pricePerHour || this.lot?.pricePerHour || 0;

        // Step 2: Create Razorpay order
        this.paymentService.createOrder({
          bookingId: b.bookingId,
          userId: user.id,
          amount: amount,
          description: `Parking at ${this.lot?.name} \u2013 Spot ${b.spotNumber}`,
        }).subscribe({
          next: async (order: RazorpayOrderResponse) => {
            this.bookingLoading = false;
            this.cdr.detectChanges();

            try {
              // Step 3: Open Razorpay popup
              const result = await this.paymentService.openCheckout(order, {
                fullName: user.fullName,
                email: user.email,
              });

              // Step 4: Verify payment
              this.bookingLoading = true;
              this.cdr.detectChanges();

              this.paymentService.verifyPayment({
                paymentId: order.paymentId,
                razorpayPaymentId: result.razorpayPaymentId,
                razorpayOrderId: result.razorpayOrderId,
                razorpaySignature: result.razorpaySignature,
              }).subscribe({
                next: (receipt: PaymentResponse) => {
                  this.lastReceipt = receipt;
                  this.bookingMessage = `Spot ${b.spotNumber} booked & paid! \u20b9${amount.toFixed(2)}`;
                  this.bookingLoading = false;
                  this.loadSpots();
                  this.cdr.detectChanges();
                },
                error: (err: any) => {
                  this.bookingLoading = false;
                  this.loadSpots();
                  this.showError(err.error?.message || 'Payment verification failed. Booking is active, pay at exit.');
                },
              });
            } catch (err: any) {
              this.bookingLoading = false;
              this.loadSpots();
              this.bookingMessage = `Spot ${b.spotNumber} booked! Payment skipped \u2013 pay at exit.`;
              this.cdr.detectChanges();
              setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 6000);
            }
          },
          error: (err: any) => {
            this.bookingLoading = false;
            this.loadSpots();
            this.bookingMessage = `Spot ${b.spotNumber} booked! Could not start payment \u2013 pay at exit.`;
            this.cdr.detectChanges();
            setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 6000);
          },
        });
      },
      error: (err: any) => {
        this.pendingSpot = null;
        this.bookingLoading = false;
        this.showError(err.error?.message || 'Booking failed.');
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
        this.bookingLoading = false;
        this.showError(err.error?.message || 'Check-in failed.');
      },
    });
  }

  checkOut(): void {
    if (!this.activeBooking) return;
    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingService.checkOut(this.activeBooking.bookingId).subscribe({
      next: (b: BookingResponse) => {
        this.activeBooking = null;
        this.bookingMessage = `Checked out! Total: \u20b9${b.totalCost?.toFixed(2)}`;
        this.bookingLoading = false;
        this.loadSpots();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 8000);
      },
      error: (err: any) => {
        this.bookingLoading = false;
        this.showError(err.error?.message || 'Check-out failed.');
      },
    });
  }

  dismissReceipt(): void {
    this.lastReceipt = null;
    this.bookingMessage = '';
    this.cdr.detectChanges();
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
        this.bookingLoading = false;
        this.showError(err.error?.message || 'Cancel failed.');
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
