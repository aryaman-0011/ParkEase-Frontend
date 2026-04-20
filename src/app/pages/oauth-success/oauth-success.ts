import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div class="text-center">
        @if (error) {
          <div class="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Login Failed</h2>
          <p class="text-neutral-500 mb-6">{{ error }}</p>
          <a routerLink="/login" class="inline-block bg-white text-neutral-900 font-semibold px-6 py-3 rounded-xl hover:bg-neutral-200 transition-all">Back to Login</a>
        } @else {
          <div class="w-16 h-16 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
            <svg class="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Signing you in...</h2>
          <p class="text-neutral-500">Please wait while we complete your Google login.</p>
        }
      </div>
    </div>
  `,
})
export class OauthSuccessComponent implements OnInit {
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (token && email) {
      // Store the token first
      localStorage.setItem('access_token', token);

      // Fetch full user profile from backend using the token
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.get<any>(`${environment.apiUrl}/auth/me`, { headers }).subscribe({
        next: (user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          // Fallback: decode token for basic info
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user = {
              id: payload.userId || 0,
              fullName: payload.fullName || email.split('@')[0],
              email: email,
              phone: null,
              role: payload.role || 'DRIVER',
              vehiclePlate: null,
              provider: payload.provider || 'GOOGLE',
              active: true,
              profilePicUrl: null,
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem('user', JSON.stringify(user));
          } catch {
            localStorage.setItem(
              'user',
              JSON.stringify({ email, fullName: email.split('@')[0], role: 'DRIVER', provider: 'GOOGLE' }),
            );
          }
          this.router.navigate(['/dashboard']);
        },
      });
    } else {
      this.error = 'No authentication token received. Please try again.';
    }
  }
}
