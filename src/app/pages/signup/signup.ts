import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
  businessName = '';
  businessRegistration = '';
  loading = false;
  error = '';
  showPassword = false;
  step = 1;
  private returnUrl = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
  }

  get totalSteps(): number {
    return this.role === 'MANAGER' ? 3 : 2;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  nextStep(): void {
    if (this.step === 1) {
      if (!this.fullName || !this.email) {
        this.error = 'Please fill in name and email';
        return;
      }
      if (this.role === 'MANAGER' && !this.phone.trim()) {
        this.error = 'Phone number is required for manager accounts';
        return;
      }
      this.error = '';
      this.step = 2;
    } else if (this.step === 2 && this.role === 'MANAGER') {
      // Validate password before going to step 3
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
      this.error = '';
      this.step = 3;
    }
  }

  prevStep(): void {
    this.error = '';
    if (this.step > 1) this.step--;
  }

  onSubmit(): void {
    this.error = '';

    // Step 2 validation for drivers (final step)
    if (this.step === 2 && this.role !== 'MANAGER') {
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
    }

    // Step 3 validation for managers
    if (this.step === 3) {
      if (!this.businessName.trim()) {
        this.error = 'Business name is required for manager accounts';
        return;
      }
      if (!this.businessRegistration.trim()) {
        this.error = 'Business registration / GST number is required';
        return;
      }
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
        businessName: this.role === 'MANAGER' ? this.businessName.trim() : undefined,
        businessRegistration: this.role === 'MANAGER' ? this.businessRegistration.trim() : undefined,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate([this.returnUrl]);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Registration failed. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }
}
