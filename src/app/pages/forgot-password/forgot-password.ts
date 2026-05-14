import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Validators } from '../../utils/validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordComponent {
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = '';
  step = 1;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  sendOtp(): void {
    this.error = '';
    this.success = '';
    if (!this.email) {
      this.error = 'Please enter your email';
      return;
    }
    const emailErr = Validators.validateEmail(this.email);
    if (emailErr) { this.error = emailErr; return; }
    this.loading = true;
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message;
        this.step = 2;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.statusText || 'Failed to send OTP';
        this.cdr.detectChanges();
      },
    });
  }

  verifyOtp(): void {
    this.error = '';
    this.success = '';
    if (!this.otp || this.otp.length !== 6) {
      this.error = 'Please enter a valid 6-digit OTP';
      return;
    }
    this.loading = true;
    this.authService.verifyOtp({ email: this.email, otp: this.otp }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message;
        this.step = 3;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid or expired OTP';
        this.cdr.detectChanges();
      },
    });
  }

  resetPassword(): void {
    this.error = '';
    this.success = '';
    if (!this.newPassword || this.newPassword.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }
    const pwErr = Validators.validatePassword(this.newPassword);
    if (pwErr) { this.error = pwErr; return; }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.loading = true;
    this.authService
      .resetPassword({ email: this.email, otp: this.otp, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = 'Password reset successfully!';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to reset password';
          this.cdr.detectChanges();
        },
      });
  }

  resendOtp(): void {
    this.otp = '';
    this.sendOtp();
  }
}
