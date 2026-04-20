import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  phone = '';
  vehiclePlate = '';
  role: 'DRIVER' | 'MANAGER' | 'ADMIN' = 'DRIVER';
  loading = false;
  error = '';
  showPassword = false;
  step = 1;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  nextStep(): void {
    if (!this.fullName || !this.email) {
      this.error = 'Please fill in name and email';
      return;
    }
    this.error = '';
    this.step = 2;
  }

  prevStep(): void {
    this.error = '';
    this.step = 1;
  }

  onSubmit(): void {
    this.error = '';
    if (!this.password || !this.confirmPassword) {
      this.error = 'Please fill in all required fields';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.authService
      .register({
        fullName: this.fullName,
        email: this.email,
        password: this.password,
        phone: this.phone || undefined,
        vehiclePlate: this.vehiclePlate || undefined,
        role: this.role,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Registration failed. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }
}
