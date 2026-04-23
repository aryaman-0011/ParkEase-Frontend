export interface CreatePaymentRequest {
  bookingId: number;
  userId: number;
  amount: number;
  paymentMethod?: 'UPI' | 'CARD' | 'WALLET' | 'CASH';
  description?: string;
}

export interface PaymentResponse {
  paymentId: number;
  bookingId: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: 'UPI' | 'CARD' | 'WALLET' | 'CASH';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId: string;
  receiptNumber: string;
  description: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  paymentId: number;
  description: string;
  prefillName?: string;
  prefillEmail?: string;
}

export interface VerifyPaymentRequest {
  paymentId: number;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface RevenueResponse {
  lotId: number;
  totalRevenue: number;
  totalPayments: number;
}
