import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LotService } from '../../../services/lot.service';
import { LotResponse } from '../../../models/lot.model';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-search-lots',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './search-lots.html',
  styleUrl: './search-lots.css',
})
export class SearchLotsComponent implements OnInit {
  lots: LotResponse[] = [];
  searchCity = '';
  searchLabel = '';
  loading = false;
  searched = false;
  locating = false;
  error = '';

  constructor(private lotService: LotService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Auto-detect location and show nearby lots on page load
    this.findNearby(true);
  }

  searchByCity(): void {
    if (!this.searchCity.trim()) {
      this.error = 'Please enter a city name';
      return;
    }
    this.error = '';
    this.loading = true;
    this.searched = true;
    this.searchLabel = this.searchCity.trim();

    this.lotService.searchByCity(this.searchCity.trim()).subscribe({
      next: (lots) => {
        this.lots = Array.isArray(lots) ? lots : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Search failed';
        this.cdr.detectChanges();
      },
    });
  }

  findNearby(silent = false): void {
    if (!navigator.geolocation) {
      if (!silent) {
        this.error = 'Geolocation is not supported by your browser';
      }
      return;
    }

    this.error = '';
    this.locating = true;
    this.searched = true;
    this.searchLabel = 'your location';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.locating = false;
        this.loading = true;
        this.cdr.detectChanges();
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.lotService.findNearbyLots(lat, lng, 15).subscribe({
          next: (lots) => {
            this.lots = Array.isArray(lots) ? lots : [];
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loading = false;
            this.error = err.error?.message || 'Failed to find nearby lots';
            this.cdr.detectChanges();
          },
        });
      },
      (err) => {
        this.locating = false;
        if (silent) {
          // On auto-load, silently reset to initial state if denied
          this.searched = false;
          this.searchLabel = '';
        } else {
          this.error = 'Location access denied. Please allow location access or search by city.';
        }
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}
