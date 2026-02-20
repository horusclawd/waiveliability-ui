# WaiveLiability UI — Claude Instructions

## Project
Angular 21 frontend for WaiveLiability. See the full architecture and roadmap in the sibling docs repo:
- `/Users/jon/Development/waiveliability/waiveliability/ARCHITECTURE.md`
- `/Users/jon/Development/waiveliability/waiveliability/ROADMAP.md`

## Git Workflow
- Each sprint has its own branch named `sprint-N/description` (e.g. `sprint-1/auth-identity`)
- Branch off `main` at the start of each sprint
- Commit regularly with clear, descriptive messages as work progresses
- At the end of each sprint:
  1. Stage and commit all remaining changes with an appropriate summary commit message
  2. Push the branch to origin
  3. Open a PR against `main` with a title and description summarizing what was completed in the sprint
  4. Do not merge — leave the PR for the owner to review and approve

## Tech Stack
- Angular 21, TypeScript 5.6 (strict), standalone components throughout
- PrimeNG (Aura theme) + PrimeFlex + PrimeIcons for UI
- Angular Signals + Services for state (no NgRx)
- Angular Reactive Forms
- Angular HttpClient with typed interceptors
- Apache ECharts via ngx-echarts for charts
- signature_pad for signature capture
- Angular CDK DragDrop for form builder
- Quill via ngx-quill for rich text
- OpenAPI Generator for auto-generated API client
- Jest + Angular Testing Library

## Mock API
- In development mode (`environment.mock = true`), a `MockInterceptor` intercepts HTTP requests and returns canned responses
- `environment.ts` sets `mock: true`
- `environment.prod.ts` sets `mock: false`
- Mock response shapes must match the OpenAPI spec exactly

## Key Conventions
- Standalone components only — no NgModules
- Functional guards and interceptors (not class-based)
- Lazy loaded feature routes
- `TenantService` holds current business state as a Signal
- `PlanGateDirective` used to hide UI elements based on plan: `*planGate="'FEATURE_NAME'"`
- Public form renderer lives under `/public` — completely separate route tree, no admin chrome
- CSS custom properties used for tenant branding on public forms
- Never share code between API and UI — OpenAPI contract is the boundary
