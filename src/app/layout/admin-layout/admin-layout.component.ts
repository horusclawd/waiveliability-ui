import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    AvatarModule,
    MenuModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);

  sidebarCollapsed = signal(false);
  user = this.auth.user;

  userMenuItems: MenuItem[] = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      routerLink: ['/admin/settings/profile'],
    },
    { separator: true },
    {
      label: 'Sign out',
      icon: 'pi pi-sign-out',
      command: () => this.auth.logout(),
    },
  ];

  navItems = [
    { label: 'Dashboard', icon: 'pi pi-home',       routerLink: '/admin/dashboard'   },
    { label: 'Forms',     icon: 'pi pi-file-edit',   routerLink: '/admin/forms'       },
    { label: 'Submissions', icon: 'pi pi-inbox',     routerLink: '/admin/submissions' },
    { label: 'Templates', icon: 'pi pi-th-large',    routerLink: '/admin/templates'   },
    { label: 'Analytics', icon: 'pi pi-chart-line',  routerLink: '/admin/analytics'   },
  ];

  bottomNavItems = [
    { label: 'Billing',  icon: 'pi pi-credit-card', routerLink: '/admin/billing'  },
    { label: 'Settings', icon: 'pi pi-cog',          routerLink: '/admin/settings' },
    { label: 'Notifications', icon: 'pi pi-bell',   routerLink: '/admin/settings/notifications' },
    { label: 'Team', icon: 'pi pi-users',           routerLink: '/admin/settings/team' },
  ];

  isAdmin = computed(() => this.user()?.role === 'admin');

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  userInitials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });
}
