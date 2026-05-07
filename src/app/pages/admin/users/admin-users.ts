import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { LotService } from '../../../services/lot.service';
import {
  AdminUserResponse,
  UserStatsResponse,
} from '../../../models/admin.model';
import { LotResponse } from '../../../models/lot.model';
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

  // Sorting
  sortField: 'id' | 'name' | 'role' | 'date' = 'id';
  sortDir: 'asc' | 'desc' = 'desc';

  // City filter for managers
  cityFilter = '';
  allCities: string[] = [];
  managerCities: Map<number, string[]> = new Map();

  // Delete confirmation
  deleteTarget: AdminUserResponse | null = null;
  confirmDeleteName = '';

  // Role change
  roleTarget: AdminUserResponse | null = null;
  newRole: 'DRIVER' | 'MANAGER' | 'ADMIN' = 'DRIVER';

  // Broadcast
  showBroadcast = false;
  broadcastTitle = '';
  broadcastMessage = '';
  broadcastAudience: 'DRIVER' | 'MANAGER' | 'ALL' = 'ALL';
  broadcastLoading = false;
  broadcastSuccess = '';
  broadcastError = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private lotService: LotService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadLotCities();
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.detectChanges();
      },
    });
  }

  loadLotCities(): void {
    this.lotService.getAllLots().subscribe({
      next: (lots: LotResponse[]) => {
        this.managerCities.clear();
        const citySet = new Set<string>();
        lots.forEach(lot => {
          if (lot.city) {
            citySet.add(lot.city);
            const existing = this.managerCities.get(lot.managerId) || [];
            if (!existing.includes(lot.city)) {
              existing.push(lot.city);
              this.managerCities.set(lot.managerId, existing);
            }
          }
        });
        this.allCities = [...citySet].sort();
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

  toggleSort(field: 'id' | 'name' | 'role' | 'date'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = field === 'name' ? 'asc' : 'desc';
    }
  }

  get sortedUsers(): AdminUserResponse[] {
    let filtered = [...this.users];

    // Apply city filter — only relevant for managers
    if (this.cityFilter) {
      const cityLower = this.cityFilter.toLowerCase();
      const managerIdsInCity = new Set<number>();
      this.managerCities.forEach((cities, managerId) => {
        if (cities.some(c => c.toLowerCase().includes(cityLower))) {
          managerIdsInCity.add(managerId);
        }
      });
      filtered = filtered.filter(u => u.role === 'MANAGER' && managerIdsInCity.has(u.id));
    }

    const dir = this.sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      switch (this.sortField) {
        case 'id': return (a.id - b.id) * dir;
        case 'name': return a.fullName.localeCompare(b.fullName) * dir;
        case 'role': return a.role.localeCompare(b.role) * dir;
        case 'date': return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        default: return 0;
      }
    });
    return filtered;
  }

  getManagerCities(managerId: number): string {
    const cities = this.managerCities.get(managerId);
    return cities?.join(', ') || '—';
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'unfold_more';
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
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

  // ── Broadcast ──

  openBroadcastModal(): void {
    this.showBroadcast = true;
    this.broadcastTitle = '';
    this.broadcastMessage = '';
    this.broadcastAudience = 'ALL';
    this.broadcastSuccess = '';
    this.broadcastError = '';
  }

  closeBroadcastModal(): void {
    this.showBroadcast = false;
  }

  sendBroadcast(): void {
    if (!this.broadcastTitle.trim() || !this.broadcastMessage.trim()) {
      this.broadcastError = 'Title and message are required.';
      return;
    }
    this.broadcastLoading = true;
    this.broadcastError = '';
    this.broadcastSuccess = '';

    const roles: string[] = this.broadcastAudience === 'ALL'
      ? ['DRIVER', 'MANAGER']
      : [this.broadcastAudience];

    // Collect user IDs from all target roles
    const idRequests = roles.map(r => this.adminService.getUserIdsByRole(r));

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(idRequests).subscribe({
        next: (results) => {
          const allIds = results.flatMap(r => r.ids);
          if (allIds.length === 0) {
            this.broadcastError = 'No users found for the selected audience.';
            this.broadcastLoading = false;
            this.cdr.detectChanges();
            return;
          }
          this.adminService.broadcastMessage(allIds, this.broadcastTitle.trim(), this.broadcastMessage.trim()).subscribe({
            next: (res) => {
              this.broadcastSuccess = `Broadcast sent to ${res.recipientCount} users!`;
              this.broadcastLoading = false;
              this.cdr.detectChanges();
              setTimeout(() => {
                this.showBroadcast = false;
                this.success = `📢 Broadcast sent to ${res.recipientCount} users!`;
                this.cdr.detectChanges();
              }, 1500);
            },
            error: () => {
              this.broadcastError = 'Failed to send broadcast. Try again.';
              this.broadcastLoading = false;
              this.cdr.detectChanges();
            },
          });
        },
        error: () => {
          this.broadcastError = 'Failed to fetch users. Try again.';
          this.broadcastLoading = false;
          this.cdr.detectChanges();
        },
      });
    });
  }
}
