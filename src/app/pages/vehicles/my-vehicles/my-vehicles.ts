import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../../services/vehicle.service';
import { AuthService } from '../../../services/auth.service';
import { VehicleResponse } from '../../../models/vehicle.model';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { Validators } from '../../../utils/validators';

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './my-vehicles.html',
  styleUrl: './my-vehicles.css',
})
export class MyVehiclesComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  loading = true;
  filterType: string = 'ALL';

  // Add / Edit modal
  showModal = false;
  editingVehicle: VehicleResponse | null = null;
  formLoading = false;
  formError = '';
  successMsg = '';

  form = {
    licensePlate: '',
    make: '',
    model: '',
    color: '',
    vehicleType: '4W',
    isEV: false,
  };

  constructor(
    private vehicleService: VehicleService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.loading = true;
    this.vehicleService.getVehiclesByOwner(user.id).subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredVehicles(): VehicleResponse[] {
    if (this.filterType === 'ALL') return this.vehicles;
    return this.vehicles.filter(v => v.vehicleType === this.filterType);
  }

  get activeCount(): number {
    return this.vehicles.filter(v => v.isActive).length;
  }

  get evCount(): number {
    return this.vehicles.filter(v => v.isEV).length;
  }

  // ── Modal ──

  openAddModal(): void {
    this.editingVehicle = null;
    this.formError = '';
    this.form = { licensePlate: '', make: '', model: '', color: '', vehicleType: '4W', isEV: false };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(v: VehicleResponse): void {
    this.editingVehicle = v;
    this.formError = '';
    this.form = {
      licensePlate: v.licensePlate,
      make: v.make,
      model: v.model,
      color: v.color || '',
      vehicleType: v.vehicleType,
      isEV: v.isEV,
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.editingVehicle = null;
    this.formError = '';
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    this.formError = '';
    if (!this.form.licensePlate || !this.form.make || !this.form.model) {
      this.formError = 'License plate, make, and model are required.';
      setTimeout(() => { this.formError = ''; this.cdr.detectChanges(); }, 6000);
      return;
    }
    if (!this.editingVehicle) {
      const plateErr = Validators.validateVehiclePlate(this.form.licensePlate);
      if (plateErr) { this.formError = plateErr; this.cdr.detectChanges(); return; }
    }
    const makeErr = Validators.validateMakeModel(this.form.make, 'Make');
    if (makeErr) { this.formError = makeErr; this.cdr.detectChanges(); return; }
    const modelErr = Validators.validateMakeModel(this.form.model, 'Model');
    if (modelErr) { this.formError = modelErr; this.cdr.detectChanges(); return; }
    if (this.form.color) {
      const colorErr = Validators.validateColor(this.form.color);
      if (colorErr) { this.formError = colorErr; this.cdr.detectChanges(); return; }
    }

    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.formLoading = true;

    if (this.editingVehicle) {
      // Update
      this.vehicleService.updateVehicle(this.editingVehicle.vehicleId, {
        make: this.form.make,
        model: this.form.model,
        color: this.form.color || undefined,
        vehicleType: this.form.vehicleType,
        isEV: this.form.isEV,
      }).subscribe({
        next: (updated) => {
          const i = this.vehicles.findIndex(v => v.vehicleId === updated.vehicleId);
          if (i >= 0) this.vehicles[i] = updated;
          this.formLoading = false;
          this.closeModal();
          this.showSuccess('Vehicle updated successfully');
        },
        error: (err) => {
          this.formLoading = false;
          this.formError = err.error?.message || 'Failed to update vehicle.';
          this.cdr.detectChanges();
          setTimeout(() => { this.formError = ''; this.cdr.detectChanges(); }, 6000);
        },
      });
    } else {
      // Register
      this.vehicleService.registerVehicle({
        ownerId: user.id,
        licensePlate: this.form.licensePlate,
        make: this.form.make,
        model: this.form.model,
        color: this.form.color || undefined,
        vehicleType: this.form.vehicleType,
        isEV: this.form.isEV,
      }).subscribe({
        next: (created) => {
          this.vehicles.unshift(created);
          this.formLoading = false;
          this.closeModal();
          this.showSuccess('Vehicle registered!');
        },
        error: (err) => {
          this.formLoading = false;
          this.formError = err.error?.message || 'Failed to register vehicle.';
          this.cdr.detectChanges();
          setTimeout(() => { this.formError = ''; this.cdr.detectChanges(); }, 6000);
        },
      });
    }
  }

  deleteVehicle(v: VehicleResponse): void {
    if (!confirm(`Delete ${v.make} ${v.model} (${v.licensePlate})?`)) return;
    this.vehicleService.deleteVehicle(v.vehicleId).subscribe({
      next: () => {
        this.vehicles = this.vehicles.filter(x => x.vehicleId !== v.vehicleId);
        this.showSuccess('Vehicle deleted');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showSuccess(err.error?.message || 'Delete failed');
      },
    });
  }

  showSuccess(msg: string): void {
    this.successMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 5000);
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case '2W': return 'two_wheeler';
      case '4W': return 'directions_car';
      case 'HEAVY': return 'local_shipping';
      default: return 'directions_car';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case '2W': return '#f472b6';
      case '4W': return '#a78bfa';
      case 'HEAVY': return '#fbbf24';
      default: return '#94a3b8';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case '2W': return '2-Wheeler';
      case '4W': return '4-Wheeler';
      case 'HEAVY': return 'Heavy';
      default: return type;
    }
  }
}
