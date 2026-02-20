import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
} from '@angular/core';
import { TenantService } from '../tenant/tenant.service';
import { PlanUpgradePromptComponent } from '../components/plan-upgrade-prompt/plan-upgrade-prompt.component';

const PLAN_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2 };

/**
 * Structural directive that shows gated content only when the current plan
 * meets or exceeds the required plan level. When the plan is insufficient,
 * the content is removed from the DOM and replaced with PlanUpgradePromptComponent.
 * Reacts to plan changes in the same session (e.g. after a plan upgrade).
 *
 * Usage: <div *appPlanGate="'basic'">...</div>
 */
@Directive({
  selector: '[appPlanGate]',
  standalone: true,
})
export class PlanGateDirective {
  @Input('appPlanGate') requiredPlan: 'basic' | 'premium' = 'basic';

  private templateRef = inject(TemplateRef<unknown>);
  private viewContainerRef = inject(ViewContainerRef);
  private tenantService = inject(TenantService);

  constructor() {
    effect(() => {
      // Reading tenant() registers a reactive dependency — re-runs on plan changes
      this.tenantService.tenant();
      this.updateView();
    });
  }

  private updateView(): void {
    this.viewContainerRef.clear();

    const currentPlan = this.tenantService.plan();
    const currentRank = PLAN_RANK[currentPlan] ?? 0;
    const requiredRank = PLAN_RANK[this.requiredPlan] ?? 1;

    if (currentRank >= requiredRank) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    } else {
      const componentRef = this.viewContainerRef.createComponent(PlanUpgradePromptComponent);
      componentRef.setInput('requiredPlan', this.requiredPlan);
    }
  }
}
