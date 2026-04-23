import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LotService } from '../../../services/lot.service';
import { LotResponse } from '../../../models/lot.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-manager-lots',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './manager-lots.html',
  styleUrl: './manager-lots.css',
})
export class ManagerLotsComponent implements OnInit {
  lots: LotResponse[] = [];
  loading = true;
  successMessage = '';
  showCreateModal = false;
  editingLot: LotResponse | null = null;
  formLoading = false;
  formError = '';

  form = {
    name: '',
    address: '',
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    totalSpots: null as number | null,
    pricePerHour: null as number | null,
    description: '',
    imageUrl: '',
  };

  constructor(private lotService: LotService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLots();
  }

  loadLots(): void {
    this.loading = true;
    this.lotService.getMyLots().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.lots = response;
        } else if (response && Array.isArray(response.content)) {
          this.lots = response.content;
        } else if (response && typeof response === 'object') {
          this.lots = [response];
        } else {
          this.lots = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleLot(lot: LotResponse): void {
    this.lotService.toggleOpenClose(lot.id).subscribe({
      next: (updated) => {
        const i = this.lots.findIndex((l) => l.id === lot.id);
        if (i >= 0) this.lots[i] = updated;
        this.showSuccess(updated.open ? 'Lot opened successfully' : 'Lot closed successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showSuccess(err.error?.message || 'Failed to toggle lot status');
        this.cdr.detectChanges();
      },
    });
  }

  startEdit(lot: LotResponse): void {
    this.editingLot = lot;
    this.form = {
      name: lot.name,
      address: lot.address,
      city: lot.city,
      state: lot.state || '',
      latitude: lot.latitude,
      longitude: lot.longitude,
      totalSpots: lot.totalSpots,
      pricePerHour: lot.pricePerHour,
      description: lot.description || '',
      imageUrl: lot.imageUrl || '',
    };
    this.formError = '';
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.editingLot = null;
    this.formError = '';
    this.resetForm();
  }

  onSubmitLot(): void {
    this.formError = '';

    if (!this.form.name || !this.form.address || !this.form.city) {
      this.formError = 'Name, address, and city are required';
      return;
    }
    if (!this.form.latitude || !this.form.longitude) {
      this.formError = 'Latitude and longitude are required';
      return;
    }

    this.formLoading = true;

    if (this.editingLot) {
      this.lotService.updateLot(this.editingLot.id, {
        name: this.form.name,
        address: this.form.address,
        city: this.form.city,
        state: this.form.state || undefined,
        latitude: this.form.latitude!,
        longitude: this.form.longitude!,
        pricePerHour: this.form.pricePerHour || undefined,
        description: this.form.description || undefined,
        imageUrl: this.form.imageUrl || undefined,
      }).subscribe({
        next: (updated) => {
          const i = this.lots.findIndex((l) => l.id === updated.id);
          if (i >= 0) this.lots[i] = updated;
          this.formLoading = false;
          this.closeModal();
          this.showSuccess('Lot updated successfully');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.formLoading = false;
          this.formError = err.error?.message || 'Failed to update lot';
          this.cdr.detectChanges();
        },
      });
    } else {
      if (!this.form.totalSpots || this.form.totalSpots < 1) {
        this.formError = 'Total spots must be at least 1';
        this.formLoading = false;
        return;
      }
      if (!this.form.pricePerHour || this.form.pricePerHour <= 0) {
        this.formError = 'Price per hour must be greater than 0';
        this.formLoading = false;
        return;
      }

      this.lotService.createLot({
        name: this.form.name,
        address: this.form.address,
        city: this.form.city,
        state: this.form.state || undefined,
        latitude: this.form.latitude!,
        longitude: this.form.longitude!,
        totalSpots: this.form.totalSpots!,
        pricePerHour: this.form.pricePerHour!,
        description: this.form.description || undefined,
        imageUrl: this.form.imageUrl || undefined,
      }).subscribe({
        next: (created) => {
          this.lots.unshift(created);
          this.formLoading = false;
          this.closeModal();
          this.showSuccess('Lot created! Waiting for admin approval.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.formLoading = false;
          this.cdr.detectChanges();
          this.formError = err.error?.message || 'Failed to create lot';
        },
      });
    }
  }

  deleteLot(lot: LotResponse): void {
    if (!confirm(`Are you sure you want to delete "${lot.name}"? This action cannot be undone.`)) {
      return;
    }
    this.lotService.deleteLot(lot.id).subscribe({
      next: () => {
        this.lots = this.lots.filter((l: LotResponse) => l.id !== lot.id);
        this.showSuccess('Lot deleted successfully');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.showSuccess(err.error?.message || 'Failed to delete lot');
        this.cdr.detectChanges();
      },
    });
  }

  private resetForm(): void {
    this.form = { name: '', address: '', city: '', state: '', latitude: null, longitude: null, totalSpots: null, pricePerHour: null, description: '', imageUrl: '' };
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 4000);
  }
}
