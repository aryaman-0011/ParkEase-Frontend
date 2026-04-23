import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';
import { PaymentResponse } from '../../../models/payment.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

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

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
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
      case 'UPI': return '📱';
      case 'CARD': return '💳';
      case 'WALLET': return '👛';
      case 'CASH': return '💵';
      default: return '💰';
    }
  }
}
