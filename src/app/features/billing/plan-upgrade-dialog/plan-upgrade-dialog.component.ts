import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PlanCardComponent } from '../plan-card/plan-card.component';
import { BillingService, Plan } from '../billing.service';

@Component({
  selector: 'app-plan-upgrade-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, PlanCardComponent],
  template: `
    <p-dialog
      header="Upgrade Your Plan"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '900px', maxWidth: '95vw' }"
      [closable]="true"
      [draggable]="false"
      (onHide)="onClose.emit()"
    >
      <div class="dialog-content">
        <p class="description">
          Choose the plan that best fits your needs. Upgrade anytime to unlock more features.
        </p>

        <div class="plans-grid">
          @for (plan of billingService.plans; track plan.id) {
            <app-plan-card
              [plan]="plan"
              [isCurrent]="isCurrentPlan(plan)"
              [subscribeLabel]="getSubscribeLabel(plan)"
              [isDisabled]="isPlanDisabled(plan)"
              (onSubscribe)="subscribe($event)"
            />
          }
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .dialog-content {
      padding: 1rem 0;
    }

    .description {
      text-align: center;
      color: var(--text-color-secondary);
      margin-bottom: 2rem;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .plans-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class PlanUpgradeDialogComponent {
  billingService = inject(BillingService);

  @Output() onClose = new EventEmitter<void>();
  @Output() onSubscribe = new EventEmitter<Plan>();

  visible = signal(false);

  isCurrentPlan(plan: Plan): boolean {
    const current = this.billingService.subscription();
    return current?.plan === plan.id;
  }

  isPlanDisabled(plan: Plan): boolean {
    const current = this.billingService.subscription();
    if (!current) return plan.id === 'free';
    if (current.plan === 'free') return plan.id === 'free';
    if (current.plan === 'basic') return plan.id === 'basic' || plan.id === 'free';
    return plan.id !== 'premium';
  }

  getSubscribeLabel(plan: Plan): string {
    const current = this.billingService.subscription();
    if (!current) return 'Subscribe';
    if (current.plan === plan.id) return 'Current';
    if (plan.id === 'free') return 'Downgrade';
    if (this.isPlanDisabled(plan)) return 'Unavailable';
    return 'Upgrade';
  }

  subscribe(plan: Plan): void {
    this.onSubscribe.emit(plan);
  }

  show(): void {
    this.visible.set(true);
  }

  hide(): void {
    this.visible.set(false);
  }
}
