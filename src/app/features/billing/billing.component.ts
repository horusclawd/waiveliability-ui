import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { PlanUpgradeDialogComponent } from './plan-upgrade-dialog/plan-upgrade-dialog.component';
import { BillingService, Plan } from './billing.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    TagModule,
    ToastModule,
    PlanUpgradeDialogComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="billing-page">
      <div class="page-header">
        <h2 class="mt-0">Billing & Subscription</h2>
        <p class="text-color-secondary">Manage your subscription and usage limits</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          <p>Loading billing information...</p>
        </div>
      } @else {
        <!-- Current Plan Section -->
        <div class="section">
          <h3>Current Plan</h3>
          <div class="current-plan-card">
            <div class="plan-info">
              <div class="plan-name-row">
                <span class="plan-name">{{ getPlanName() }}</span>
                <p-tag
                  [value]="subscription()?.status ?? 'No Subscription'"
                  [severity]="getStatusSeverity()"
                ></p-tag>
              </div>
              @if (subscription()?.currentPeriodEnd) {
                <p class="period-end">
                  Current period ends: {{ formatDate(subscription()!.currentPeriodEnd!) }}
                </p>
              }
            </div>
            <div class="plan-actions">
              <button
                pButton
                label="Upgrade Plan"
                icon="pi pi-arrow-up"
                (click)="openUpgradeDialog()"
              ></button>
              @if (subscription()?.status) {
                <button
                  pButton
                  label="Manage Subscription"
                  icon="pi pi-external-link"
                  class="p-button-outlined"
                  (click)="openPortal()"
                ></button>
              }
            </div>
          </div>
        </div>

        <!-- Usage Section -->
        <div class="section">
          <h3>Usage</h3>
          <div class="usage-grid">
            <div class="usage-card">
              <div class="usage-header">
                <span class="usage-label">Forms</span>
                <span class="usage-count">
                  {{ limits()?.forms?.used ?? 0 }} / {{ getLimitDisplay(limits()?.forms?.limit) }}
                </span>
              </div>
              <p-progressBar
                [value]="getUsagePercentage(limits()?.forms)"
                [showValue]="false"
                [style]="{ height: '8px' }"
              ></p-progressBar>
              @if (isAtLimit(limits()?.forms)) {
                <p class="limit-warning">
                  <i class="pi pi-exclamation-triangle"></i>
                  You have reached your form limit
                </p>
              }
            </div>

            <div class="usage-card">
              <div class="usage-header">
                <span class="usage-label">Submissions</span>
                <span class="usage-count">
                  {{ limits()?.submissions?.used ?? 0 }} /
                  {{ getLimitDisplay(limits()?.submissions?.limit) }}
                </span>
              </div>
              <p-progressBar
                [value]="getUsagePercentage(limits()?.submissions)"
                [showValue]="false"
                [style]="{ height: '8px' }"
              ></p-progressBar>
              @if (isAtLimit(limits()?.submissions)) {
                <p class="limit-warning">
                  <i class="pi pi-exclamation-triangle"></i>
                  You have reached your submission limit
                </p>
              }
            </div>
          </div>
        </div>

        <!-- Subscribe CTA (if no subscription) -->
        @if (!subscription()?.status) {
          <div class="section cta-section">
            <div class="cta-card">
              <h3>Subscribe to a Plan</h3>
              <p>Unlock more forms, submissions, and premium features.</p>
              <button pButton label="View Plans" icon="pi pi-arrow-right" (click)="openUpgradeDialog()"></button>
            </div>
          </div>
        }
      }

      <app-plan-upgrade-dialog
        (onClose)="upgradeDialogVisible = false"
        (onSubscribe)="handleSubscribe($event)"
        #upgradeDialog
      />
    </div>
  `,
  styles: [`
    .billing-page {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h2 {
      margin-bottom: 0.5rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: var(--text-color-secondary);
    }

    .section {
      margin-bottom: 2rem;
    }

    .section h3 {
      margin-bottom: 1rem;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .current-plan-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .plan-name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .plan-name {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .period-end {
      color: var(--text-color-secondary);
      margin: 0;
    }

    .plan-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .usage-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 640px) {
      .usage-grid {
        grid-template-columns: 1fr;
      }
    }

    .usage-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .usage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .usage-label {
      font-weight: 600;
    }

    .usage-count {
      color: var(--text-color-secondary);
      font-family: monospace;
    }

    .limit-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #f97316;
      font-size: 0.875rem;
      margin-top: 0.75rem;
    }

    .cta-section {
      margin-top: 2rem;
    }

    .cta-card {
      background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      color: white;
    }

    .cta-card h3 {
      margin-bottom: 0.5rem;
    }

    .cta-card p {
      opacity: 0.9;
      margin-bottom: 1.5rem;
    }

    .cta-card button {
      background: white;
      color: var(--primary-color);
      border: none;
    }
  `],
})
export class BillingComponent implements OnInit {
  private billingService = inject(BillingService);
  private messageService = inject(MessageService);

  subscription = this.billingService.subscription;
  limits = this.billingService.usageLimits;

  loading = signal(true);
  upgradeDialogVisible = false;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      subscription: this.billingService.getSubscription(),
      limits: this.billingService.getLimits(),
    }).subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  getPlanName(): string {
    const sub = this.subscription();
    return sub?.plan ? this.billingService.getPlan(sub.plan)?.name ?? 'Free' : 'Free';
  }

  getStatusSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const status = this.subscription()?.status;
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'info';
      case 'past_due':
        return 'danger';
      case 'canceled':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getLimitDisplay(limit: number | undefined): string {
    if (limit === undefined || limit === -1) return 'Unlimited';
    return limit.toString();
  }

  getUsagePercentage(usage: { used: number; limit: number } | undefined | null): number {
    if (!usage || usage.limit === -1) return 0;
    return Math.min((usage.used / usage.limit) * 100, 100);
  }

  isAtLimit(usage: { used: number; limit: number } | undefined | null): boolean {
    if (!usage || usage.limit === -1) return false;
    return usage.used >= usage.limit;
  }

  openUpgradeDialog(): void {
    this.upgradeDialogVisible = true;
  }

  openPortal(): void {
    this.billingService.createPortalSession().subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to open billing portal',
        });
      },
    });
  }

  handleSubscribe(plan: Plan): void {
    this.billingService.createCheckoutSession(plan.id).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create checkout session',
        });
      },
    });
  }
}
