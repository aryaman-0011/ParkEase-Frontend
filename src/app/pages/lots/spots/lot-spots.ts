import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotService } from '../../../services/spot.service';
import { LotService } from '../../../services/lot.service';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { PaymentService } from '../../../services/payment.service';
import { VehicleService } from '../../../services/vehicle.service';
import { SpotResponse, SpotCountResponse, SpotType } from '../../../models/spot.model';
import { LotResponse } from '../../../models/lot.model';
import { BookingResponse } from '../../../models/booking.model';
import { VehicleResponse } from '../../../models/vehicle.model';
import { PaymentResponse, RazorpayOrderResponse } from '../../../models/payment.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-lot-spots',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
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

  // Bookings (multiple active)
  activeBookings: BookingResponse[] = [];
  bookingLoading = false;
  bookingMessage = '';
  bookingError = '';

  // Vehicles
  vehicles: VehicleResponse[] = [];

  // Spot schedules (spotId → booked time slots)
  spotSchedules: Map<number, BookingResponse[]> = new Map();

  // Booking modal (step 1: payment, step 2: details)
  pendingSpot: SpotResponse | null = null;
  showPaymentModal = false;
  showBookingModal = false;
  paymentMethod: 'CASH' | 'ONLINE' = 'CASH';

  // Booking form
  bookForm = {
    vehicleId: null as number | null,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  };

  // Extend modal
  showExtendModal = false;
  extendingBooking: BookingResponse | null = null;
  extendDate = '';
  extendTime = '';

  // Payment receipt
  lastReceipt: PaymentResponse | null = null;

  // Auth modal for guests
  showAuthModal = false;
  pendingGuestSpot: SpotResponse | null = null;

  spotTypes: SpotType[] = ['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'];

  /** Today's date string (yyyy-MM-dd) — used as [min] for date inputs */
  get todayDate(): string {
    return this.toDateStr(new Date());
  }

  constructor(
    private spotService: SpotService,
    private lotService: LotService,
    private bookingService: BookingService,
    private authService: AuthService,
    private paymentService: PaymentService,
    private vehicleService: VehicleService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.lotId = Number(this.route.snapshot.paramMap.get('lotId'));
    this.loadLot();
    this.loadSpots();
    this.loadActiveBookings();
    this.loadVehicles();
    this.loadSpotSchedules();
  }

  loadLot(): void {
    this.lotService.getLotById(this.lotId).subscribe({
      next: (lot: LotResponse) => { this.lot = lot; this.cdr.detectChanges(); },
    });
  }

  loadSpots(): void {
    this.loading = true;
    this.spotService.getSpotsByLot(this.lotId).subscribe({
      next: (spots: SpotResponse[]) => { this.spots = spots; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
    this.spotService.getSpotCounts(this.lotId).subscribe({
      next: (counts: SpotCountResponse) => { this.counts = counts; this.cdr.detectChanges(); },
    });
  }

  /** Refresh spots + schedules together (call after any booking change) */
  refreshData(): void {
    this.loadSpots();
    this.loadSpotSchedules();
  }

  loadActiveBookings(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.bookingService.getActiveBookings(user.id).subscribe({
      next: (bookings: BookingResponse[]) => { this.activeBookings = bookings; this.cdr.detectChanges(); },
      error: () => { this.activeBookings = []; this.cdr.detectChanges(); },
    });
  }

  loadSpotSchedules(): void {
    this.bookingService.getLotBookings(this.lotId).subscribe({
      next: (bookings: BookingResponse[]) => {
        this.spotSchedules.clear();
        const now = new Date();
        const activeBookings = bookings.filter(b =>
          (b.status === 'RESERVED' || b.status === 'ACTIVE') &&
          new Date(b.scheduledEndTime) > now
        );
        for (const b of activeBookings) {
          const list = this.spotSchedules.get(b.spotId) || [];
          list.push(b);
          this.spotSchedules.set(b.spotId, list);
        }
        // Sort each list by start time
        this.spotSchedules.forEach((list) =>
          list.sort((a, c) => new Date(a.scheduledStartTime).getTime() - new Date(c.scheduledStartTime).getTime())
        );
        this.cdr.detectChanges();
      },
    });
  }

  getSpotBookings(spotId: number): BookingResponse[] {
    return this.spotSchedules.get(spotId) || [];
  }

  loadVehicles(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.vehicleService.getVehiclesByOwner(user.id).subscribe({
      next: (v: VehicleResponse[]) => { this.vehicles = v.filter(x => x.isActive); this.cdr.detectChanges(); },
    });
  }

  private showError(msg: string): void {
    this.bookingError = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.bookingError = ''; this.cdr.detectChanges(); }, 6000);
  }

  // ── STEP 1: Click Book → Payment Modal ──
  bookSpot(spot: SpotResponse): void {
    const user = this.authService.getCurrentUser();
    // Guest: show auth modal
    if (!user) {
      this.pendingGuestSpot = spot;
      this.showAuthModal = true;
      this.cdr.detectChanges();
      return;
    }
    // Check if driver has a compatible vehicle
    const compatible = this.vehicles.filter(v => v.isActive && this.isVehicleCompatible(v, spot));
    if (this.vehicles.length > 0 && compatible.length === 0) {
      this.showError(`This spot requires a ${this.getTypeLabel(spot.vehicleType)} vehicle. You don't have a matching vehicle registered.`);
      return;
    }
    this.pendingSpot = spot;
    this.showPaymentModal = true;
    this.cdr.detectChanges();
  }

  goToLogin(): void {
    const returnUrl = `/lots/${this.lotId}/spots`;
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  goToSignup(): void {
    const returnUrl = `/lots/${this.lotId}/spots`;
    this.router.navigate(['/signup'], { queryParams: { returnUrl } });
  }

  dismissAuthModal(): void {
    this.showAuthModal = false;
    this.pendingGuestSpot = null;
    this.cdr.detectChanges();
  }

  dismissPaymentModal(): void {
    this.showPaymentModal = false;
    this.pendingSpot = null;
    this.cdr.detectChanges();
  }

  // ── STEP 2: Choose payment → Booking Details Modal ──
  selectPayment(method: 'CASH' | 'ONLINE'): void {
    this.paymentMethod = method;
    this.showPaymentModal = false;
    this.showBookingModal = true;
    // Set default times (now + 1hr)
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    this.bookForm.startDate = this.toDateStr(now);
    this.bookForm.startTime = this.toTimeStr(now);
    this.bookForm.endDate = this.toDateStr(end);
    this.bookForm.endTime = this.toTimeStr(end);
    this.bookForm.vehicleId = this.compatibleVehicles.length > 0 ? this.compatibleVehicles[0].vehicleId : null;
    this.cdr.detectChanges();
  }

  dismissBookingModal(): void {
    this.showBookingModal = false;
    this.pendingSpot = null;
    this.cdr.detectChanges();
  }

  get estimatedHours(): number {
    const start = this.parseDateTime(this.bookForm.startDate, this.bookForm.startTime);
    const end = this.parseDateTime(this.bookForm.endDate, this.bookForm.endTime);
    if (!start || !end || end <= start) return 0;
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
  }

  get estimatedCost(): number {
    const rate = this.pendingSpot?.pricePerHour || this.lot?.pricePerHour || 0;
    return this.estimatedHours * rate;
  }

  get selectedVehicle(): VehicleResponse | undefined {
    return this.vehicles.find(v => v.vehicleId === this.bookForm.vehicleId);
  }

  get compatibleVehicles(): VehicleResponse[] {
    if (!this.pendingSpot) return this.vehicles.filter(v => v.isActive);
    return this.vehicles.filter(v => v.isActive && this.isVehicleCompatible(v, this.pendingSpot!));
  }

  isVehicleCompatible(vehicle: VehicleResponse, spot: SpotResponse): boolean {
    const map: Record<string, string> = {
      'TWO_WHEELER': '2W',
      'FOUR_WHEELER': '4W',
      'HEAVY': 'HEAVY',
    };
    return vehicle.vehicleType === (map[spot.vehicleType] || spot.vehicleType);
  }

  // ── STEP 3: Submit Booking ──
  submitBooking(): void {
    if (!this.pendingSpot) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;
    const spot = this.pendingSpot;

    const start = this.parseDateTime(this.bookForm.startDate, this.bookForm.startTime);
    const end = this.parseDateTime(this.bookForm.endDate, this.bookForm.endTime);
    if (!start || !end) { this.showError('Please select valid start and end times.'); return; }
    if (start < new Date()) { this.showError('Start time cannot be in the past.'); return; }
    if (end <= start) { this.showError('End time must be after start time.'); return; }

    this.showBookingModal = false;
    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingMessage = '';

    const request = {
      userId: user.id,
      spotId: spot.spotId,
      lotId: this.lotId,
      vehicleId: this.bookForm.vehicleId || undefined,
      vehiclePlate: this.selectedVehicle?.licensePlate || user.vehiclePlate || undefined,
      scheduledStartTime: this.toLocalISOString(start),
      scheduledEndTime: this.toLocalISOString(end),
    };

    this.bookingService.createBooking(request).subscribe({
      next: (b: BookingResponse) => {
        this.activeBookings.push(b);
        this.pendingSpot = null;

        if (this.paymentMethod === 'ONLINE') {
          this.handleOnlinePayment(b, spot, user);
        } else {
          this.bookingMessage = `Spot ${b.spotNumber} booked (${this.bookForm.startTime}–${this.bookForm.endTime})! Pay ₹${this.estimatedCost} in cash.`;
          this.bookingLoading = false;
          this.refreshData();
          this.cdr.detectChanges();
          setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 6000);
        }
      },
      error: (err: any) => {
        this.pendingSpot = null;
        this.bookingLoading = false;
        this.showError(err.error?.message || 'Booking failed.');
      },
    });
  }

  private handleOnlinePayment(b: BookingResponse, spot: SpotResponse, user: any): void {
    const amount = this.estimatedCost || spot.pricePerHour || this.lot?.pricePerHour || 0;
    this.paymentService.createOrder({
      bookingId: b.bookingId,
      userId: user.id,
      amount: amount,
      description: `Parking at ${this.lot?.name} – Spot ${b.spotNumber}`,
    }).subscribe({
      next: async (order: RazorpayOrderResponse) => {
        this.bookingLoading = false;
        this.cdr.detectChanges();
        try {
          const result = await this.paymentService.openCheckout(order, {
            fullName: user.fullName, email: user.email,
          });
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
              this.bookingMessage = `Spot ${b.spotNumber} booked & paid! ₹${amount.toFixed(2)}`;
              this.bookingLoading = false;
              this.refreshData();
              this.cdr.detectChanges();
            },
            error: () => {
              this.bookingLoading = false;
              this.refreshData();
              this.showError('Payment verification failed. Booking active — pay at exit.');
            },
          });
        } catch {
          // User cancelled payment — cancel the booking
          this.bookingService.cancelBooking(b.bookingId).subscribe({
            next: () => {
              this.activeBookings = this.activeBookings.filter(x => x.bookingId !== b.bookingId);
              this.bookingLoading = false;
              this.refreshData();
              this.showError('Payment cancelled — booking has been removed.');
            },
            error: () => {
              this.bookingLoading = false;
              this.refreshData();
              this.showError('Payment cancelled — please cancel the booking manually.');
            },
          });
        }
      },
      error: () => {
        this.bookingLoading = false;
        this.refreshData();
        this.bookingMessage = `Spot ${b.spotNumber} booked! Could not start payment — pay at exit.`;
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 6000);
      },
    });
  }

  // ── Check-in / Check-out / Cancel (per booking) ──
  checkIn(b: BookingResponse): void {
    this.bookingLoading = true;
    this.bookingService.checkIn(b.bookingId).subscribe({
      next: (updated: BookingResponse) => {
        this.updateBookingInList(updated);
        this.bookingMessage = `Checked in to ${updated.spotNumber}!`;
        this.bookingLoading = false;
        this.refreshData();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err: any) => { this.bookingLoading = false; this.showError(err.error?.message || 'Check-in failed.'); },
    });
  }

  checkOut(b: BookingResponse): void {
    this.bookingLoading = true;
    this.bookingService.checkOut(b.bookingId).subscribe({
      next: (updated: BookingResponse) => {
        this.activeBookings = this.activeBookings.filter(x => x.bookingId !== updated.bookingId);
        this.bookingMessage = `Checked out from ${updated.spotNumber}! Total: ₹${updated.totalCost?.toFixed(2)}`;
        this.bookingLoading = false;
        this.refreshData();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 8000);
      },
      error: (err: any) => { this.bookingLoading = false; this.showError(err.error?.message || 'Check-out failed.'); },
    });
  }

  cancelBooking(b: BookingResponse): void {
    this.bookingLoading = true;
    this.bookingService.cancelBooking(b.bookingId).subscribe({
      next: () => {
        this.activeBookings = this.activeBookings.filter(x => x.bookingId !== b.bookingId);
        this.bookingMessage = `Booking for ${b.spotNumber} cancelled.`;
        this.bookingLoading = false;
        this.refreshData();
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err: any) => { this.bookingLoading = false; this.showError(err.error?.message || 'Cancel failed.'); },
    });
  }

  // ── Extend Booking ──
  openExtendModal(b: BookingResponse): void {
    this.extendingBooking = b;
    const end = new Date(b.scheduledEndTime);
    const newEnd = new Date(end.getTime() + 60 * 60 * 1000); // +1hr default
    this.extendDate = this.toDateStr(newEnd);
    this.extendTime = this.toTimeStr(newEnd);
    this.showExtendModal = true;
    this.cdr.detectChanges();
  }

  dismissExtendModal(): void {
    this.showExtendModal = false;
    this.extendingBooking = null;
    this.cdr.detectChanges();
  }

  submitExtend(): void {
    if (!this.extendingBooking) return;
    const newEnd = this.parseDateTime(this.extendDate, this.extendTime);
    if (!newEnd) { this.showError('Please select a valid time.'); return; }

    this.showExtendModal = false;
    this.bookingLoading = true;
    this.bookingService.extendBooking(this.extendingBooking.bookingId, {
      newEndTime: this.toLocalISOString(newEnd),
    }).subscribe({
      next: (updated: BookingResponse) => {
        this.updateBookingInList(updated);
        this.bookingMessage = `Booking extended until ${this.extendTime}!`;
        this.bookingLoading = false;
        this.extendingBooking = null;
        this.cdr.detectChanges();
        setTimeout(() => { this.bookingMessage = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err: any) => {
        this.bookingLoading = false;
        this.extendingBooking = null;
        this.showError(err.error?.message || 'Cannot extend booking.');
      },
    });
  }

  // ── Receipt ──
  dismissReceipt(): void {
    this.lastReceipt = null;
    this.bookingMessage = '';
    this.cdr.detectChanges();
  }

  // ── Helpers ──
  private updateBookingInList(updated: BookingResponse): void {
    const idx = this.activeBookings.findIndex(x => x.bookingId === updated.bookingId);
    if (idx >= 0) this.activeBookings[idx] = updated;
  }

  isSpotBookedByMe(spot: SpotResponse): boolean {
    return this.activeBookings.some(b => b.spotId === spot.spotId);
  }

  get filteredSpots(): SpotResponse[] {
    if (this.filterType === 'ALL') return this.spots;
    return this.spots.filter((s) => s.spotType === this.filterType);
  }

  getSpotTypeIcon(type: string): string {
    switch (type) {
      case 'COMPACT': return 'local_taxi';
      case 'STANDARD': return 'directions_car';
      case 'LARGE': return 'local_shipping';
      case 'MOTORBIKE': return 'two_wheeler';
      case 'EV': return 'electric_car';
      default: return 'local_parking';
    }
  }

  getSpotTypeColor(type: string): string {
    switch (type) {
      case 'COMPACT': return '#60a5fa';
      case 'STANDARD': return '#a78bfa';
      case 'LARGE': return '#fbbf24';
      case 'MOTORBIKE': return '#f472b6';
      case 'EV': return '#34d399';
      default: return '#94a3b8';
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

  getVehicleTypeIcon(type: string): string {
    switch (type) {
      case 'TWO_WHEELER': return 'two_wheeler';
      case 'FOUR_WHEELER': return 'directions_car';
      case 'HEAVY': return 'local_shipping';
      default: return 'directions_car';
    }
  }

  getVehicleTypeColor(type: string): string {
    switch (type) {
      case 'TWO_WHEELER': return '#f472b6';
      case 'FOUR_WHEELER': return '#a78bfa';
      case 'HEAVY': return '#fbbf24';
      default: return '#94a3b8';
    }
  }

  // ── Date/time utilities (LOCAL time, not UTC) ──
  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  private toTimeStr(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  private parseDateTime(date: string, time: string): Date | null {
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00`);
  }
  /** Format a Date as local datetime string for backend (yyyy-MM-ddTHH:mm:ss) */
  private toLocalISOString(d: Date): string {
    return `${this.toDateStr(d)}T${this.toTimeStr(d)}:00`;
  }
}
