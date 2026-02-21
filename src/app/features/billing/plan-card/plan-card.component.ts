import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Plan } from './billing.service';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TagModule],
  template: `
    <div class="plan-card" [class.current]="isCurrent" [class.popular]="plan.id === 'basic'">
      @if (plan.id === 'basic') {
        <div class="popular-badge">Most Popular</div>
      }

      <h3 class="plan-name">{{ plan.name }}</h3>
      <div class="plan-price">
        <span class="price">\${{ plan.price }}</span>
        <span class="period">/mo</span>
      </div>

      <ul class="plan-features">
        @for (feature of plan.features; track feature) {
          <li>
            <i class="pi pi-check"></i>
            {{ feature }}
          </li>
        }
      </ul>

      @if (isCurrent) {
        <div class="current-badge">
          <i class="pi pi-check-circle"></i> Current Plan
        </div>
      } @else {
        <button
          pButton
          [label]="subscribeLabel"
          class="w-full"
          [class.p-button-outlined]="plan.id === 'free'"
          [disabled]="isDisabled"
          (click)="onSubscribe.emit(plan)"
        ></button>
      }
    </div>
  `,
  styles: [`
    .plan-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 2rem;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .plan-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .plan-card.popular {
      border-color: var(--primary-color);
      border-width: 2px;
    }

    .plan-card.current {
      background: var(--surface-ground);
      border-color: var(--primary-color);
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary-color);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .plan-name {
      margin: 0 0 1rem;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .plan-price {
      margin-bottom: 1.5rem;
    }

    .price {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .period {
      color: var(--text-color-secondary);
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
    }

    .plan-features li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: var(--text-color);
    }

    .plan-features li i {
      color: var(--primary-color);
    }

    .current-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: var(--surface-ground);
      border-radius: 8px;
      color: var(--primary-color);
      font-weight: 600;
    }
  `],
})
export class PlanCardComponent {
  @Input() plan!: Plan;
  @Input() isCurrent = false;
  @Input() isDisabled = false;
  @Input() subscribeLabel = 'Subscribe';
  @Output() onSubscribe = new EventEmitter<Plan>();
}
