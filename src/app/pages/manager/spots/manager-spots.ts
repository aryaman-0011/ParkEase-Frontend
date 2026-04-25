import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SpotService } from '../../../services/spot.service';
import { LotService } from '../../../services/lot.service';
import { SpotResponse, SpotCountResponse, SpotType, VehicleType } from '../../../models/spot.model';
import { LotResponse } from '../../../models/lot.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-manager-spots',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './manager-spots.html',
  styleUrl: './manager-spots.css',
})
export class ManagerSpotsComponent implements OnInit {
  lotId!: number;
  lot: LotResponse | null = null;
  spots: SpotResponse[] = [];
  counts: SpotCountResponse | null = null;
  loading = true;
  successMessage = '';
  filterStatus: string = 'ALL';

  /* ───── Bulk create form ───── */
  showBulkModal = false;
  bulkLoading = false;
  bulkError = '';
  bulkForm = {
    count: 10,
    prefix: 'A',
    startFrom: 1,
    floor: 0,
    spotType: 'STANDARD' as SpotType,
    vehicleType: 'FOUR_WHEELER' as VehicleType,
    isHandicapped: false,
    isEVCharging: false,
    pricePerHour: null as number | null,
  };

  spotTypes: SpotType[] = ['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'];
  vehicleTypes: VehicleType[] = ['TWO_WHEELER', 'FOUR_WHEELER', 'HEAVY'];

  constructor(
    private spotService: SpotService,
    private lotService: LotService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.lotId = Number(this.route.snapshot.paramMap.get('lotId'));
    this.loadLot();
    this.loadSpots();
  }

  loadLot(): void {
    this.lotService.getLotById(this.lotId).subscribe({
      next: (lot: LotResponse) => {
        this.lot = lot;
        this.cdr.detectChanges();
      },
    });
  }

  loadSpots(): void {
    this.loading = true;
    this.spotService.getSpotsByLot(this.lotId).subscribe({
      next: (spots: SpotResponse[]) => {
        this.spots = spots;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
    this.spotService.getSpotCounts(this.lotId).subscribe({
      next: (counts: SpotCountResponse) => {
        this.counts = counts;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredSpots(): SpotResponse[] {
    if (this.filterStatus === 'ALL') return this.spots;
    return this.spots.filter((s) => s.status === this.filterStatus);
  }

  /* ───── Bulk create ───── */

  onBulkCreate(): void {
    if (this.bulkForm.count < 1) {
      this.bulkError = 'Count must be at least 1';
      setTimeout(() => { this.bulkError = ''; this.cdr.detectChanges(); }, 6000);
      return;
    }
    this.bulkLoading = true;
    this.bulkError = '';

    this.spotService.addBulkSpots({
      lotId: this.lotId,
      count: this.bulkForm.count,
      prefix: this.bulkForm.prefix,
      startFrom: this.bulkForm.startFrom,
      floor: this.bulkForm.floor,
      spotType: this.bulkForm.spotType,
      vehicleType: this.bulkForm.vehicleType,
      isHandicapped: this.bulkForm.isHandicapped,
      isEVCharging: this.bulkForm.isEVCharging,
      pricePerHour: this.bulkForm.pricePerHour || undefined,
    }).subscribe({
      next: (created: SpotResponse[]) => {
        this.spots.push(...created);
        this.bulkLoading = false;
        this.showBulkModal = false;
        this.showSuccess(`${created.length} spots created successfully`);
        this.loadSpots();
      },
      error: (err: any) => {
        this.bulkLoading = false;
        this.bulkError = err.error?.message || 'Failed to create spots';
        this.cdr.detectChanges();
        setTimeout(() => { this.bulkError = ''; this.cdr.detectChanges(); }, 6000);
      },
    });
  }

  /* ───── Status actions ───── */

  releaseSpot(spot: SpotResponse): void {
    this.spotService.releaseSpot(spot.spotId).subscribe({
      next: (updated: SpotResponse) => {
        const i = this.spots.findIndex((s) => s.spotId === updated.spotId);
        if (i >= 0) this.spots[i] = updated;
        this.showSuccess(`Spot ${updated.spotNumber} released`);
        this.loadSpots();
      },
      error: (err: any) => this.showSuccess(err.error?.message || 'Failed'),
    });
  }

  deleteSpot(spot: SpotResponse): void {
    this.spotService.deleteSpot(spot.spotId).subscribe({
      next: () => {
        this.spots = this.spots.filter((s) => s.spotId !== spot.spotId);
        this.showSuccess(`Spot ${spot.spotNumber} deleted`);
        this.loadSpots();
      },
      error: (err: any) => this.showSuccess(err.error?.message || 'Failed'),
    });
  }

  /* ───── Helpers ───── */

  getStatusColor(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'text-emerald-400';
      case 'RESERVED': return 'text-amber-400';
      case 'OCCUPIED': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'RESERVED': return 'bg-amber-500/10 border-amber-500/20';
      case 'OCCUPIED': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  }

  getSpotTypeIcon(type: string): string {
    switch (type) {
      case 'COMPACT': return '🚗';
      case 'STANDARD': return '🚙';
      case 'LARGE': return '🚐';
      case 'MOTORBIKE': return '🏍️';
      case 'EV': return '⚡';
      default: return '🅿️';
    }
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 4000);
  }
}
