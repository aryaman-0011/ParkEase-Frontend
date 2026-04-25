import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserResponse } from '../../models/auth.model';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent implements OnInit {
  activeTab: 'profile' | 'password' | 'danger' = 'profile';
  user: UserResponse | null = null;
  loading = false;
  success = '';
  error = '';

  // Profile fields
  fullName = '';
  phone = '';
  vehiclePlate = '';

  // Password fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;

  // Deactivate
  confirmDeactivate = false;

  // Delete Account
  showDeleteModal = false;
  deleteConfirmText = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.fullName = this.user.fullName || '';
      this.phone = this.user.phone || '';
      this.vehiclePlate = this.user.vehiclePlate || '';
    }
  }

  setTab(tab: 'profile' | 'password' | 'danger'): void {
    this.activeTab = tab;
    this.success = '';
    this.error = '';
  }

  onUpdateProfile(): void {
    this.error = '';
    this.success = '';
    if (!this.fullName.trim()) {
      this.error = 'Full name is required';
      return;
    }
    this.loading = true;
    this.authService.updateProfile({
      fullName: this.fullName.trim(),
      phone: this.phone?.trim() || undefined,
      vehiclePlate: this.vehiclePlate?.trim() || undefined,
    }).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.success = 'Profile updated successfully';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to update profile';
        this.cdr.detectChanges();
      },
    });
  }

  onChangePassword(): void {
    this.error = '';
    this.success = '';
    if (!this.currentPassword || !this.newPassword) {
      this.error = 'All password fields are required';
      return;
    }
    if (this.newPassword.length < 8) {
      this.error = 'New password must be at least 8 characters';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'New passwords do not match';
      return;
    }
    this.loading = true;
    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Password changed successfully';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to change password';
        this.cdr.detectChanges();
      },
    });
  }

  onDeactivate(): void {
    this.error = '';
    this.loading = true;
    this.authService.deactivateAccount().subscribe({
      next: () => {
        this.loading = false;
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to deactivate account';
        this.cdr.detectChanges();
      },
    });
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
    this.deleteConfirmText = '';
    this.error = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteConfirmText = '';
  }

  onDeleteAccount(): void {
    if (this.deleteConfirmText.trim().toLowerCase() !== 'yes') {
      this.error = 'Please type "yes" to confirm account deletion';
      this.cdr.detectChanges();
      return;
    }
    this.error = '';
    this.loading = true;
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.loading = false;
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to delete account';
        this.cdr.detectChanges();
      },
    });
  }
}
