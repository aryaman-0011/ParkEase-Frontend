import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SpotService } from '../../../services/spot.service';
import { LotService } from '../../../services/lot.service';
import { SpotResponse, SpotCountResponse, SpotType } from '../../../models/spot.model';
import { LotResponse } from '../../../models/lot.model';

@Component({
  selector: 'app-lot-spots',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lot-spots.html',
  styleUrl: './lot-spots.css',
})
export class LotSpotsComponent implements OnInit {
  lotId!: number;
  lot: LotResponse | null = null;
  spots: SpotResponse[] = [];
  counts: SpotCountResponse | null = null;
  loading = true;
  filterType: string = 'ALL';

  spotTypes: SpotType[] = ['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'];

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
    this.spotService.getAvailableSpots(this.lotId).subscribe({
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
    if (this.filterType === 'ALL') return this.spots;
    return this.spots.filter((s) => s.spotType === this.filterType);
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

  getTypeLabel(type: string): string {
    switch (type) {
      case 'TWO_WHEELER': return '2-Wheeler';
      case 'FOUR_WHEELER': return '4-Wheeler';
      case 'HEAVY': return 'Heavy';
      default: return type;
    }
  }
}
