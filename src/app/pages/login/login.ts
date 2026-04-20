import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  rememberMe = false;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Remember Me: if user already has a valid token, skip login
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const oauthError = this.route.snapshot.queryParamMap.get('oauth_error');
    if (oauthError) {
      this.error = `Google login failed: ${oauthError}`;
      this.cdr.detectChanges();
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password, rememberMe: this.rememberMe }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.statusText || 'Invalid email or password';
        this.cdr.detectChanges();
      },
    });
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  loginWithGithub(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/github';
  }
}
