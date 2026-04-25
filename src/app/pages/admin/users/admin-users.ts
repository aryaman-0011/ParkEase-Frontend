import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import {
  AdminUserResponse,
  UserStatsResponse,
} from '../../../models/admin.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {
  users: AdminUserResponse[] = [];
  stats: UserStatsResponse | null = null;
  search = '';
  roleFilter = '';
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  loading = false;
  error = '';
  success = '';
  actionLoading: Record<number, boolean> = {};

  // Delete confirmation
  deleteTarget: AdminUserResponse | null = null;
  confirmDeleteName = '';

  // Role change
  roleTarget: AdminUserResponse | null = null;
  newRole: 'DRIVER' | 'MANAGER' | 'ADMIN' = 'DRIVER';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.detectChanges();
      },
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.adminService
      .getUsers(this.page, this.size, this.search, this.roleFilter || undefined)
      .subscribe({
        next: (res) => {
          this.users = res.content;
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load users';
          this.cdr.detectChanges();
        },
      });
  }

  onSearch(): void {
    this.page = 0;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadUsers();
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadUsers();
    }
  }

  onSuspend(user: AdminUserResponse): void {
    this.clearMessages();
    this.actionLoading[user.id] = true;
    this.adminService.suspendUser(user.id).subscribe({
      next: (updated) => {
        this.updateUserInList(updated);
        this.actionLoading[user.id] = false;
        this.success = `${user.fullName} has been suspended`;
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading[user.id] = false;
        this.error = err.error?.message || 'Failed to suspend user';
        this.cdr.detectChanges();
      },
    });
  }

  onActivate(user: AdminUserResponse): void {
    this.clearMessages();
    this.actionLoading[user.id] = true;
    this.adminService.activateUser(user.id).subscribe({
      next: (updated) => {
        this.updateUserInList(updated);
        this.actionLoading[user.id] = false;
        this.success = `${user.fullName} has been reactivated`;
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading[user.id] = false;
        this.error = err.error?.message || 'Failed to activate user';
        this.cdr.detectChanges();
      },
    });
  }

  // Role change
  openRoleModal(user: AdminUserResponse): void {
    this.roleTarget = user;
    this.newRole = user.role as 'DRIVER' | 'MANAGER' | 'ADMIN';
  }

  closeRoleModal(): void {
    this.roleTarget = null;
  }

  confirmRoleChange(): void {
    if (!this.roleTarget) return;
    const userId = this.roleTarget.id;
    this.clearMessages();
    this.actionLoading[userId] = true;
    this.adminService.updateUserRole(userId, { role: this.newRole }).subscribe({
      next: (updated) => {
        this.updateUserInList(updated);
        this.actionLoading[userId] = false;
        this.success = `Role updated to ${this.newRole}`;
        this.closeRoleModal();
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading[userId] = false;
        this.error = err.error?.message || 'Failed to update role';
        this.closeRoleModal();
        this.cdr.detectChanges();
      },
    });
  }

  // Delete
  openDeleteModal(user: AdminUserResponse): void {
    this.deleteTarget = user;
    this.confirmDeleteName = '';
  }

  closeDeleteModal(): void {
    this.deleteTarget = null;
    this.confirmDeleteName = '';
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    const userId = this.deleteTarget.id;
    this.clearMessages();
    this.actionLoading[userId] = true;
    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.actionLoading[userId] = false;
        this.success = 'User deleted permanently';
        this.closeDeleteModal();
        this.loadUsers();
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading[userId] = false;
        this.error = err.error?.message || 'Failed to delete user';
        this.closeDeleteModal();
        this.cdr.detectChanges();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'badge-admin';
      case 'MANAGER':
        return 'badge-manager';
      default:
        return 'badge-driver';
    }
  }

  getStatusBadgeClass(active: boolean): string {
    return active ? 'badge-active' : 'badge-suspended';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private updateUserInList(updated: AdminUserResponse): void {
    const idx = this.users.findIndex((u) => u.id === updated.id);
    if (idx !== -1) {
      this.users[idx] = updated;
    }
  }

  private clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}
