import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreatePaymentRequest,
  PaymentResponse,
  RazorpayOrderResponse,
  VerifyPaymentRequest,
  RevenueResponse,
} from '../models/payment.model';

declare var Razorpay: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  /* ───── Razorpay Flow ───── */

  /** Step 1: Create Razorpay order on backend */
  createOrder(request: CreatePaymentRequest): Observable<RazorpayOrderResponse> {
    return this.http.post<RazorpayOrderResponse>(`${this.apiUrl}/create-order`, request);
  }

  /** Step 2: Open Razorpay Checkout popup */
  openCheckout(order: RazorpayOrderResponse, user: { fullName?: string; email?: string }): Promise<{
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }> {
    return new Promise((resolve, reject) => {
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkEase',
        description: order.description,
        order_id: order.orderId,
        prefill: {
          name: user.fullName || '',
          email: user.email || '',
        },
        theme: {
          color: '#22c55e',
        },
        handler: (response: any) => {
          resolve({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        reject(new Error(response.error.description || 'Payment failed'));
      });
      rzp.open();
    });
  }

  /** Step 3: Verify payment on backend */
  verifyPayment(request: VerifyPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/verify`, request);
  }

  /* ───── Standard CRUD ───── */

  createPayment(request: CreatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.apiUrl, request);
  }

  getPayment(id: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${id}`);
  }

  getPaymentByBooking(bookingId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/booking/${bookingId}`);
  }

  getUserPayments(userId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/user/${userId}`);
  }

  getTotalSpent(userId: number): Observable<{ userId: number; totalSpent: number }> {
    return this.http.get<{ userId: number; totalSpent: number }>(`${this.apiUrl}/user/${userId}/total`);
  }

  confirmPayment(id: number): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.apiUrl}/${id}/confirm`, {});
  }

  refundPayment(id: number): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.apiUrl}/${id}/refund`, {});
  }

  getLotRevenue(lotId: number): Observable<RevenueResponse> {
    return this.http.get<RevenueResponse>(`${this.apiUrl}/lot/${lotId}/revenue`);
  }
}
