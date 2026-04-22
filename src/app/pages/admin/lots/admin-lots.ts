import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LotService } from '../../../services/lot.service';
import { AdminService } from '../../../services/admin.service';
import { LotResponse } from '../../../models/lot.model';
import { AdminUserResponse } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-lots',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-lots.html',
  styleUrl: './admin-lots.css',
})
export class AdminLotsComponent implements OnInit {
  pendingLots: LotResponse[] = [];
  managers: AdminUserResponse[] = [];
  selectedManager: AdminUserResponse | null = null;
  managerLots: LotResponse[] = [];
  loading = true;
  managersLoading = false;
  lotsLoading = false;
  actionLoading: number | null = null;
  successMessage = '';
  activeTab: 'pending' | 'manage' = 'pending';

  constructor(
    private lotService: LotService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadPending();
    this.loadManagers();
  }

  loadPending(): void {
    this.loading = true;
    this.lotService.getPendingLots().subscribe({
      next: (lots: LotResponse[]) => {
        this.pendingLots = lots;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  loadManagers(): void {
    this.managersLoading = true;
    this.adminService.getUsers(0, 100, undefined, 'MANAGER').subscribe({
      next: (res: any) => {
        this.managers = res.content || [];
        this.managersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.managersLoading = false; this.cdr.detectChanges(); },
    });
  }

  selectManager(manager: AdminUserResponse): void {
    this.selectedManager = manager;
    this.lotsLoading = true;
    this.managerLots = [];
    this.lotService.getLotsByManagerId(manager.id).subscribe({
      next: (lots: LotResponse[]) => {
        this.managerLots = lots;
        this.lotsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.lotsLoading = false; this.cdr.detectChanges(); },
    });
  }

  clearSelection(): void {
    this.selectedManager = null;
    this.managerLots = [];
  }

  approve(lot: LotResponse): void {
    this.actionLoading = lot.id;
    this.lotService.approveLot(lot.id).subscribe({
      next: () => {
        this.pendingLots = this.pendingLots.filter((l: LotResponse) => l.id !== lot.id);
        this.actionLoading = null;
        this.showSuccess(`"${lot.name}" approved`);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionLoading = null;
        this.showSuccess(err.error?.message || 'Failed to approve');
      },
    });
  }

  reject(lot: LotResponse): void {
    if (!confirm(`Reject and permanently delete "${lot.name}"?`)) return;
    this.actionLoading = lot.id;
    this.lotService.rejectLot(lot.id).subscribe({
      next: () => {
        this.pendingLots = this.pendingLots.filter((l: LotResponse) => l.id !== lot.id);
        this.actionLoading = null;
        this.showSuccess(`"${lot.name}" rejected`);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionLoading = null;
        this.showSuccess(err.error?.message || 'Failed to reject');
      },
    });
  }

  deleteLot(lot: LotResponse): void {
    if (!confirm(`Permanently delete "${lot.name}"?`)) return;
    this.actionLoading = lot.id;
    this.lotService.deleteLotAsAdmin(lot.id).subscribe({
      next: () => {
        this.managerLots = this.managerLots.filter((l: LotResponse) => l.id !== lot.id);
        this.pendingLots = this.pendingLots.filter((l: LotResponse) => l.id !== lot.id);
        this.actionLoading = null;
        this.showSuccess(`"${lot.name}" deleted`);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionLoading = null;
        this.showSuccess(err.error?.message || 'Failed to delete');
        this.cdr.detectChanges();
      },
    });
  }

  getStatusLabel(lot: LotResponse): string {
    if (!lot.approved) return 'Pending';
    return lot.open ? 'Open' : 'Closed';
  }

  getStatusClass(lot: LotResponse): string {
    if (!lot.approved) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20';
    return lot.open
      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20'
      : 'text-red-400 bg-red-500/15 border-red-500/20';
  }

  getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 4000);
  }
}
