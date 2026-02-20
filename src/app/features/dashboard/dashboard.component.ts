import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="router-fade">
      <h2 class="mt-0">Dashboard</h2>
      <p class="text-color-secondary">Overview stats and recent activity — coming in Sprint 10.</p>
    </div>
  `,
})
export class DashboardComponent {}
