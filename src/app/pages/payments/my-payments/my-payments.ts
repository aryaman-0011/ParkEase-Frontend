import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';
import { BookingService } from '../../../services/booking.service';
import { PaymentResponse } from '../../../models/payment.model';
import { BookingResponse } from '../../../models/booking.model';
import { NavbarComponent } from '../../../components/navbar/navbar';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './my-payments.html',
  styleUrl: './my-payments.css',
})
export class MyPaymentsComponent implements OnInit {
  payments: PaymentResponse[] = [];
  totalSpent = 0;
  loading = true;
  filterStatus: string = 'ALL';

  // Receipt modal
  showReceipt = false;
  receiptPayment: PaymentResponse | null = null;
  receiptBooking: BookingResponse | null = null;
  receiptLoading = false;
  emailSending = false;
  emailSent = false;
  emailError = '';

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.loadPayments(user.id);
    this.loadTotalSpent(user.id);
  }

  loadPayments(userId: number): void {
    this.loading = true;
    this.paymentService.getUserPayments(userId).subscribe({
      next: (payments: PaymentResponse[]) => {
        this.payments = payments;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadTotalSpent(userId: number): void {
    this.paymentService.getTotalSpent(userId).subscribe({
      next: (res: { userId: number; totalSpent: number }) => {
        this.totalSpent = res.totalSpent;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredPayments(): PaymentResponse[] {
    if (this.filterStatus === 'ALL') return this.payments;
    return this.payments.filter(p => p.status === this.filterStatus);
  }

  get successCount(): number {
    return this.payments.filter(p => p.status === 'SUCCESS').length;
  }

  get refundedCount(): number {
    return this.payments.filter(p => p.status === 'REFUNDED').length;
  }

  getMethodIcon(method: string): string {
    switch (method) {
      case 'UPI': return 'UPI';
      case 'CARD': return 'CARD';
      case 'WALLET': return 'WALLET';
      case 'CASH': return 'CASH';
      default: return 'Rs';
    }
  }

  // ── Receipt Modal ──
  openReceipt(p: PaymentResponse): void {
    this.receiptPayment = p;
    this.receiptBooking = null;
    this.showReceipt = true;
    this.receiptLoading = true;
    this.emailSent = false;
    this.emailSending = false;
    this.cdr.detectChanges();

    this.bookingService.getBooking(p.bookingId).subscribe({
      next: (b) => {
        this.receiptBooking = b;
        this.receiptLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.receiptLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  closeReceipt(): void {
    this.showReceipt = false;
    this.receiptPayment = null;
    this.receiptBooking = null;
  }

  emailReceipt(): void {
    const p = this.receiptPayment;
    if (!p || this.emailSending) return;
    const b = this.receiptBooking;

    const details: Record<string, string> = {
      receiptNumber: p.receiptNumber,
      amount: p.amount.toFixed(2),
      status: p.status,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId || 'N/A',
      date: this.formatDate(p.paidAt),
      description: p.description || 'Parking fee',
      lotName: b?.lotName || 'N/A',
      spotNumber: b?.spotNumber || 'N/A',
      vehiclePlate: b?.vehiclePlate || 'N/A',
      duration: this.getDuration(),
    };

    this.emailSending = true;
    this.emailSent = false;
    this.emailError = '';
    this.cdr.detectChanges();

    this.authService.sendReceiptEmail(details).subscribe({
      next: () => {
        this.emailSending = false;
        this.emailSent = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Receipt email error:', err);
        this.emailSending = false;
        this.emailError = 'Failed to send email';
        this.cdr.detectChanges();
      },
    });
  }

  formatDate(d: string | null): string {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  getDuration(): string {
    const b = this.receiptBooking;
    if (!b) return 'N/A';
    const start = new Date(b.scheduledStartTime);
    const end = new Date(b.scheduledEndTime);
    const diffMs = end.getTime() - start.getTime();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} hr`;
    return `${hrs} hr ${mins} min`;
  }

  // ── PDF Download ──
  downloadReceipt(): void {
    const p = this.receiptPayment;
    if (!p) return;
    const b = this.receiptBooking;
    const user = this.authService.getCurrentUser();
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Colors
    const brand: [number, number, number] = [59, 46, 30];
    const accent: [number, number, number] = [139, 94, 60];
    const dark: [number, number, number] = [40, 40, 40];
    const gray: [number, number, number] = [130, 130, 130];
    const lightGray: [number, number, number] = [210, 210, 210];
    const cream: [number, number, number] = [245, 236, 224];

    // ── Header band ──
    doc.setFillColor(...brand);
    doc.rect(0, 0, w, 42, 'F');

    // Accent stripe
    doc.setFillColor(...accent);
    doc.rect(0, 42, w, 2, 'F');

    // Brand text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...cream);
    doc.text('ParkEase', 20, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 190, 175);
    doc.text('PAYMENT RECEIPT', 20, 28);

    // Receipt # right
    doc.setFontSize(9);
    doc.setTextColor(200, 190, 175);
    doc.text(p.receiptNumber, w - 20, 16, { align: 'right' });

    // Status badge
    const statusColors: Record<string, [number, number, number]> = {
      SUCCESS: [34, 197, 94],
      PENDING: [245, 158, 11],
      FAILED: [239, 68, 68],
      REFUNDED: [56, 189, 248],
    };
    const sc = statusColors[p.status] || gray;
    doc.setFillColor(...sc);
    const sText = p.status;
    doc.setFontSize(8);
    const sW = doc.getTextWidth(sText) + 8;
    doc.roundedRect(w - 20 - sW, 22, sW + 4, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(sText, w - 20 - sW + (sW + 4) / 2, 26.5, { align: 'center' });

    // Date right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 190, 175);
    doc.text(this.formatDate(p.paidAt), w - 20, 36, { align: 'right' });

    // ── Amount section ──
    let y = 56;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('AMOUNT PAID', 20, y);

    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brand);
    const amtText = (p.status === 'REFUNDED' ? '- ' : '') + 'Rs. ' + p.amount.toFixed(2);
    doc.text(amtText, 20, y + 14);

    // ── Divider ──
    y += 24;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.2);
    doc.line(20, y, w - 20, y);

    // ── Details Section ──
    y += 10;
    const checkPage = () => {
      if (y > pageH - 30) {
        doc.addPage();
        y = 20;
      }
    };
    const drawRow = (label: string, value: string) => {
      checkPage();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(label, 20, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      // Truncate long values
      const maxW = w - 40 - doc.getTextWidth(label);
      const lines = doc.splitTextToSize(value, maxW);
      doc.text(lines[0], w - 20, y, { align: 'right' });
      y += 8;
    };

    // Section: Payment Details
    checkPage();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('PAYMENT DETAILS', 20, y);
    y += 8;

    drawRow('Payment Method', p.paymentMethod);
    drawRow('Transaction ID', p.transactionId || 'N/A');
    drawRow('Date & Time', this.formatDate(p.paidAt));
    drawRow('Currency', p.currency || 'INR');

    // Divider
    y += 4;
    doc.setDrawColor(...lightGray);
    doc.line(20, y, w - 20, y);
    y += 8;

    // Section: Booking Details
    checkPage();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('BOOKING DETAILS', 20, y);
    y += 8;

    drawRow('Booking ID', '#' + p.bookingId);
    if (b) {
      drawRow('Parking Lot', b.lotName || 'N/A');
      drawRow('Spot', b.spotNumber || 'N/A');
      drawRow('Vehicle', b.vehiclePlate || 'N/A');
      drawRow('Check-in', this.formatDate(b.scheduledStartTime));
      drawRow('Check-out', this.formatDate(b.scheduledEndTime));
      drawRow('Duration', this.getDuration());
      if (b.pricePerHour) {
        drawRow('Rate', 'Rs. ' + b.pricePerHour.toFixed(2) + '/hr');
      }
    }
    drawRow('Description', p.description || 'Parking fee');

    // Divider
    y += 4;
    doc.line(20, y, w - 20, y);
    y += 8;

    // Section: Customer
    if (user) {
      checkPage();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accent);
      doc.text('CUSTOMER', 20, y);
      y += 8;

      drawRow('Name', user.fullName);
      drawRow('Email', user.email);
      if (user.phone) drawRow('Phone', user.phone);
    }

    // ── Footer ──
    y += 12;
    checkPage();
    doc.setDrawColor(...lightGray);
    doc.line(20, y, w - 20, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...gray);
    doc.text('This is a computer-generated receipt and does not require a signature.', w / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('ParkEase  |  Smart Parking, Simplified  |  parkease.com', w / 2, y, { align: 'center' });

    doc.save(`ParkEase_Receipt_${p.receiptNumber}.pdf`);
  }
}
