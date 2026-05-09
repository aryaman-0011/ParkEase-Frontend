import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../services/analytics.service';
import { LotService } from '../../../services/lot.service';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-analytics.html',
  styleUrl: './admin-analytics.css',
})
export class AdminAnalyticsComponent implements OnInit {
  // Platform summary
  platformSummary: any = null;

  // Lot selector
  lots: any[] = [];
  selectedLotId: number | null = null;

  // Lot-specific analytics
  occupancyRate: number = 0;
  peakHours: any = null;
  hourlyData: { hour: number; rate: number }[] = [];
  spotTypes: { type: string; count: number }[] = [];
  avgDuration: number = 0;
  revenue: any = null;
  dailyReport: any = null;

  loading = false;
  generatingPdf = false;

  // Donut chart colors
  private readonly donutColors = [
    '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
  ];

  constructor(
    private analyticsService: AnalyticsService,
    private lotService: LotService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadPlatformSummary();
    this.loadLots();
  }

  private loadPlatformSummary(): void {
    this.analyticsService.getPlatformSummary().subscribe({
      next: (data) => {
        this.platformSummary = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.platformSummary = { totalLotsTracked: 0, totalOccupancyLogs: 0, overallOccupancyRate: 0 };
      },
    });
  }

  private loadLots(): void {
    this.lotService.getAllLots().subscribe({
      next: (lots) => {
        this.lots = lots;
        this.cdr.detectChanges();
      },
    });
  }

  onLotSelected(): void {
    if (!this.selectedLotId) return;
    this.loading = true;
    this.dailyReport = null;
    this.loadLotAnalytics(this.selectedLotId);
  }

  private loadLotAnalytics(lotId: number): void {
    this.analyticsService.getOccupancyRate(lotId).subscribe({
      next: (d) => { this.occupancyRate = d.occupancyRate || 0; this.cdr.detectChanges(); },
    });

    this.analyticsService.getPeakHours(lotId).subscribe({
      next: (d) => { this.peakHours = d; this.cdr.detectChanges(); },
    });

    this.analyticsService.getOccupancyByHour(lotId).subscribe({
      next: (d) => {
        const hourly = d.hourly || {};
        this.hourlyData = Object.keys(hourly).map((h) => ({ hour: +h, rate: hourly[h] }));
        this.cdr.detectChanges();
      },
    });

    this.analyticsService.getSpotTypes(lotId).subscribe({
      next: (d) => {
        const types = d.spotTypes || {};
        this.spotTypes = Object.keys(types).map((t) => ({ type: t, count: types[t] }));
        this.cdr.detectChanges();
      },
    });

    this.analyticsService.getAvgDuration(lotId).subscribe({
      next: (d) => { this.avgDuration = d.avgDurationMinutes || 0; this.cdr.detectChanges(); },
    });

    this.analyticsService.getRevenue(lotId).subscribe({
      next: (d) => { this.revenue = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; },
    });
  }

  loadDailyReport(): void {
    if (!this.selectedLotId) return;
    this.analyticsService.getDailyReport(this.selectedLotId).subscribe({
      next: (d) => { this.dailyReport = d; this.cdr.detectChanges(); },
    });
  }

  // ── Chart Helpers ──

  formatHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  getBarWidth(rate: number): number {
    return Math.min(rate, 100);
  }

  /** SVG gauge: circumference = 2 * π * 52 ≈ 326.73 */
  getGaugeOffset(pct: number): number {
    const circumference = 326.73;
    return circumference - (circumference * Math.min(pct, 100)) / 100;
  }

  /** CSS conic-gradient for the donut chart */
  getDonutGradient(): string {
    if (!this.spotTypes.length) return '';
    const total = this.getTotalVehicles();
    if (total === 0) return 'background: rgba(255,255,255,0.05)';
    let gradientParts: string[] = [];
    let cumPct = 0;
    for (let i = 0; i < this.spotTypes.length; i++) {
      const pct = (this.spotTypes[i].count / total) * 100;
      const color = this.donutColors[i % this.donutColors.length];
      gradientParts.push(`${color} ${cumPct}% ${cumPct + pct}%`);
      cumPct += pct;
    }
    return `background: conic-gradient(${gradientParts.join(', ')})`;
  }

  getDonutColor(index: number): string {
    return this.donutColors[index % this.donutColors.length];
  }

  getTotalVehicles(): number {
    return this.spotTypes.reduce((sum, st) => sum + st.count, 0);
  }

  getVehiclePct(count: number): string {
    const total = this.getTotalVehicles();
    if (total === 0) return '0';
    return ((count / total) * 100).toFixed(0);
  }

  formatVehicleType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /** Generate and download PDF report */
  async downloadReportPdf(): Promise<void> {
    if (!this.dailyReport || !this.selectedLotId) return;
    this.generatingPdf = true;
    this.cdr.detectChanges();

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const lot = this.lots.find((l: any) => l.id === this.selectedLotId);
      const lotName = lot ? `${lot.name} — ${lot.city}` : `Lot #${this.selectedLotId}`;
      const now = new Date().toLocaleString();

      // ── Header ──
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ParkEase Analytics', 20, 22);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 160);
      doc.text(`Daily Report — ${lotName}`, 20, 32);
      doc.text(`Generated: ${now}`, 20, 39);

      // ── Key Metrics ──
      let y = 58;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics', 20, y);
      y += 10;

      const metrics = [
        ['Occupancy Rate', `${this.dailyReport.occupancyRate}%`],
        ["Today's Activity", `${this.dailyReport.todayActivityCount} logs`],
        ['Avg Duration', `${Math.round(this.dailyReport.avgDuration)} minutes`],
        ['Peak Hour', this.peakHours?.peakHour != null ? `${this.formatHour(this.peakHours.peakHour)} (${this.peakHours.peakRate}%)` : 'N/A'],
      ];

      doc.setFontSize(10);
      for (const [label, value] of metrics) {
        // Row background
        doc.setFillColor(248, 248, 248);
        doc.rect(20, y - 5, 170, 10, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 24, y + 1);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(value, 186, y + 1, { align: 'right' });
        y += 12;
      }

      // ── Hourly Breakdown ──
      if (this.hourlyData.length > 0) {
        y += 8;
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Hourly Occupancy', 20, y);
        y += 10;

        const barAreaWidth = 160;
        const barHeight = 8;
        doc.setFontSize(8);

        for (const item of this.hourlyData) {
          if (y > 270) { doc.addPage(); y = 20; }
          const barWidth = (item.rate / 100) * barAreaWidth;

          // Color based on rate
          if (item.rate > 80) doc.setFillColor(248, 113, 113);
          else if (item.rate > 50) doc.setFillColor(251, 191, 36);
          else doc.setFillColor(52, 211, 153);

          doc.roundedRect(46, y - 5, barWidth, barHeight, 2, 2, 'F');
          doc.setTextColor(120, 120, 120);
          doc.setFont('helvetica', 'normal');
          doc.text(this.formatHour(item.hour), 24, y + 1);
          doc.text(`${item.rate}%`, 46 + barWidth + 3, y + 1);
          y += 11;
        }
      }

      // ── Vehicle Types ──
      if (this.spotTypes.length > 0) {
        y += 8;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicle Type Distribution', 20, y);
        y += 10;

        doc.setFontSize(10);
        for (let i = 0; i < this.spotTypes.length; i++) {
          if (y > 275) { doc.addPage(); y = 20; }
          const st = this.spotTypes[i];
          const color = this.donutColors[i % this.donutColors.length];
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);

          doc.setFillColor(r, g, b);
          doc.circle(26, y - 1, 3, 'F');
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'normal');
          doc.text(this.formatVehicleType(st.type), 34, y + 1);
          doc.setFont('helvetica', 'bold');
          doc.text(`${st.count} (${this.getVehiclePct(st.count)}%)`, 186, y + 1, { align: 'right' });
          y += 10;
        }
      }

      // ── Footer ──
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(`ParkEase Analytics Report — Page ${p} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      doc.save(`ParkEase_Report_Lot${this.selectedLotId}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      this.generatingPdf = false;
      this.cdr.detectChanges();
    }
  }
}
