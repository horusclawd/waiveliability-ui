import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-plan-upgrade-prompt',
  standalone: true,
  imports: [RouterLink, ButtonModule, MessageModule],
  template: `
    <div class="flex flex-column align-items-start gap-3 p-3 border-round surface-50 border-1 border-orange-200">
      <div class="flex align-items-center gap-2 text-orange-700">
        <i class="pi pi-lock text-xl"></i>
        <span class="font-medium">
          This feature requires the {{ requiredPlanLabel }} plan or higher.
        </span>
      </div>
      <p-button
        label="Upgrade Plan"
        icon="pi pi-arrow-up-right"
        severity="warn"
        size="small"
        [routerLink]="['/admin/billing']"
      />
    </div>
  `,
})
export class PlanUpgradePromptComponent {
  @Input() requiredPlan: 'basic' | 'premium' = 'basic';

  get requiredPlanLabel(): string {
    return this.requiredPlan.charAt(0).toUpperCase() + this.requiredPlan.slice(1);
  }
}
