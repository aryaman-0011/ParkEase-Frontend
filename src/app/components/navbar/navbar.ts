import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserResponse } from '../../models/auth.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit {
  @Input() activePage: string = 'home';
  user: UserResponse | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Load cached user immediately (no flash)
    this.user = this.auth.getCurrentUser();
    // Subscribe to any updates
    this.auth.currentUser$.subscribe((u) => {
      if (u) this.user = u;
    });
  }

  getInitials(): string {
    if (!this.user?.fullName) return '?';
    return this.user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getFirstName(): string {
    return this.user?.fullName?.split(' ')[0] || '';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
