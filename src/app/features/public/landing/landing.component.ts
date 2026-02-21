import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `
    <div class="landing-page" style="min-height: 100vh; display: flex; flex-direction: column">
      <!-- Header -->
      <header style="padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-border)">
        <div class="logo" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color)">
          WaiveLiability
        </div>
        <div class="nav-links" style="display: flex; gap: 1.5rem; align-items: center">
          <a routerLink="#" class="text-color" style="text-decoration: none">About</a>
          <a routerLink="#" class="text-color" style="text-decoration: none">Pricing</a>
          <a routerLink="#" class="text-color" style="text-decoration: none">Contact</a>
          <p-button label="Sign In" [text]="true" severity="secondary" routerLink="/auth/login" />
          <p-button label="Get Started" routerLink="/auth/register" />
        </div>
      </header>

      <!-- Hero Section -->
      <main style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center">
        <h1 style="font-size: 3rem; font-weight: 700; margin-bottom: 1rem; max-width: 800px">
          Create legal waivers and collect signatures in minutes
        </h1>
        <p style="font-size: 1.25rem; color: var(--text-color-secondary); margin-bottom: 2rem; max-width: 600px">
          Professional liability release forms with digital signatures. Easy to create, simple to share, legally binding.
        </p>
        <div style="display: flex; gap: 1rem">
          <p-button label="Start Free" size="large" routerLink="/auth/register" />
          <p-button label="View Pricing" size="large" [outlined]="true" severity="secondary" />
        </div>

        <!-- Features Grid -->
        <div style="margin-top: 5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; max-width: 1000px; width: 100%">
          <div class="feature-card p-4 border-round" style="text-align: left; background: var(--surface-card); border: 1px solid var(--surface-border)">
            <i class="pi pi-file-edit text-2xl mb-3" style="color: var(--primary-color)"></i>
            <h3 class="mt-0 mb-2">Easy Form Builder</h3>
            <p class="m-0 text-color-secondary">Create custom waiver forms with our drag-and-drop builder. Add text fields, checkboxes, and more.</p>
          </div>
          <div class="feature-card p-4 border-round" style="text-align: left; background: var(--surface-card); border: 1px solid var(--surface-border)">
            <i class="pi pi-check-square text-2xl mb-3" style="color: var(--primary-color)"></i>
            <h3 class="mt-0 mb-2">Digital Signatures</h3>
            <p class="m-0 text-color-secondary">Collect legally binding signatures online. Works on any device - desktop or mobile.</p>
          </div>
          <div class="feature-card p-4 border-round" style="text-align: left; background: var(--surface-card); border: 1px solid var(--surface-border)">
            <i class="pi pi-file-pdf text-2xl mb-3" style="color: var(--primary-color)"></i>
            <h3 class="mt-0 mb-2">PDF Generation</h3>
            <p class="m-0 text-color-secondary">Automatically generate signed PDF documents stored securely in the cloud.</p>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer style="padding: 2rem; border-top: 1px solid var(--surface-border); text-align: center">
        <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto">
          <div class="text-color-secondary text-sm">
            &copy; 2026 WaiveLiability. All rights reserved.
          </div>
          <div style="display: flex; gap: 1.5rem">
            <a routerLink="#" class="text-color-secondary text-sm" style="text-decoration: none">Privacy Policy</a>
            <a routerLink="#" class="text-color-secondary text-sm" style="text-decoration: none">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingComponent {}
