import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserResponse } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-neutral-950 text-white">
      <nav class="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span class="text-lg font-black text-neutral-900">P</span>
          </div>
          <span class="text-lg font-bold tracking-tight">ParkEase</span>
          @if (user?.role === 'ADMIN') {
            <span class="text-xs bg-purple-500/15 text-purple-400 px-2.5 py-1 rounded-lg border border-purple-500/20 ml-1">Admin</span>
          }
          @if (user?.role === 'MANAGER') {
            <span class="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 ml-1">Manager</span>
          }
        </div>
        <div class="flex items-center gap-3">
          @if (user?.role === 'ADMIN') {
            <a routerLink="/admin/users" class="text-sm text-neutral-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
              Manage Users
            </a>
          }
          <a routerLink="/settings" class="text-sm text-neutral-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Settings
          </a>
          <button (click)="logout()" class="text-sm text-neutral-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
            Sign Out
          </button>
        </div>
      </nav>
      <div class="max-w-3xl mx-auto px-8 py-16">
        <h1 class="text-4xl font-bold mb-4">Welcome, {{ user?.fullName }} 👋</h1>
        <p class="text-neutral-400 text-lg mb-8">You're signed in as <span class="text-white font-medium">{{ user?.role }}</span></p>

        <!-- User Info Card -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 mb-8">
          <div class="flex justify-between py-2 border-b border-white/5"><span class="text-neutral-500">Email</span><span>{{ user?.email }}</span></div>
          <div class="flex justify-between py-2 border-b border-white/5"><span class="text-neutral-500">Role</span><span>{{ user?.role }}</span></div>
          <div class="flex justify-between py-2 border-b border-white/5"><span class="text-neutral-500">Phone</span><span>{{ user?.phone || '—' }}</span></div>
          <div class="flex justify-between py-2 border-b border-white/5"><span class="text-neutral-500">Vehicle</span><span>{{ user?.vehiclePlate || '—' }}</span></div>
          <div class="flex justify-between py-2"><span class="text-neutral-500">Provider</span><span>{{ user?.provider }}</span></div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @if (user?.role === 'ADMIN') {
            <a routerLink="/admin/users" class="quick-action-card group">
              <div class="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
              </div>
              <div class="text-sm font-medium text-white mb-1">Manage Users</div>
              <div class="text-xs text-neutral-500">View, suspend, and manage all users</div>
            </a>
          }
          <a routerLink="/settings" class="quick-action-card group">
            <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
              <svg class="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div class="text-sm font-medium text-white mb-1">Account Settings</div>
            <div class="text-xs text-neutral-500">Update profile, change password</div>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-action-card {
      display: block;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .quick-action-card:hover {
      border-color: rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
  `],
})
export class DashboardComponent implements OnInit {
  user: UserResponse | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    // Also refresh from server to stay in sync
    this.authService.getProfile().subscribe({
      next: (u) => (this.user = u),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

