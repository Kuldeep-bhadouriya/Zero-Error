Performance + Security Roadmap Prompts

## Phase 1

Prompt 1:
Harden baseline security controls with a rollback-safe CSP rollout.

Scope:
- Update app/api/contact/route.ts to validate and sanitize request payloads server-side, enforce strict method handling, and return consistent error shapes without leaking internals.
- Update lib/rate-limit.ts to support route-specific limits and predictable keying (IP/user fallback), then apply it to app/api/contact/route.ts.
- Update next.config.mjs and proxy.ts to add modern security headers (X-Content-Type-Options, Referrer-Policy, X-Frame-Options/Frame-Ancestors, Permissions-Policy) and CSP in Report-Only mode first.
- Keep app/api/auth/[...nextauth]/route.ts behavior unchanged while ensuring auth routes are not blocked by CSP/header updates.

Constraints:
- Preserve existing behavior and response contracts unless explicitly hardened.
- Do not break auth/admin flows.
- Keep TypeScript and ESLint clean.

Implementation requirements:
- Add environment-toggle support for CSP mode: report-only first, enforce only when explicitly enabled.
- Add nonce/hash-friendly CSP structure if inline scripts/styles exist; avoid over-broad wildcards.
- Ensure proxy/header logic does not duplicate conflicting headers.

Acceptance criteria:
- Contact API rejects invalid payloads with 4xx and valid payloads still succeed.
- Rate limiting triggers at configured thresholds and returns deterministic status/message.
- CSP is emitted as Report-Only by default and can be switched to enforce mode via env flag.
- Auth sign-in/session/admin protected routes still function.

Checks to run:
- pnpm lint
- pnpm test -- --runInBand (or project-equivalent unit/integration tests)
- Targeted API checks for app/api/contact/route.ts and app/api/auth/[...nextauth]/route.ts

Measurable outcomes:
- 100% of responses from touched routes include intended security headers.
- Contact endpoint rejects malformed input and rate-limit abuse in reproducible tests.
- Zero auth regression in existing auth/admin flows.

Prompt 2:
Create a staged rollout verification checklist for the CSP/reporting implementation directly in code comments/config notes near next.config.mjs and proxy.ts changes (no separate docs file).

Scope:
- Add concise inline notes near CSP config explaining report-only phase, monitoring signals, and enforce switch conditions.

Constraints:
- Keep comments minimal and implementation-focused.
- No behavior changes beyond what Prompt 1 already introduced.

Acceptance criteria:
- Engineers can identify exact env flag and switch path for Report-Only to enforce mode from code.

Checks to run:
- pnpm lint

Measurable outcomes:
- CSP rollout mode is discoverable in less than 2 minutes by a new contributor.

## Phase 2

Prompt 1:
Implement API caching and revalidation strategy for public/high-read endpoints with rollback-safe controls.

Scope:
- Update app/api/announcements/active/route.ts, app/api/events/route.ts, app/api/events/current/route.ts with explicit caching semantics (Cache-Control and/or Next revalidate strategy), consistent ETag/Last-Modified handling where appropriate, and clear no-store for personalized/private data.
- Ensure app/api/admin/submissions/route.ts remains non-cacheable and admin-safe.
- Add env-driven cache TTL overrides so caching can be reduced/disabled quickly if issues arise.

Constraints:
- Preserve existing payload shapes and sorting/filtering behavior.
- Do not break auth/admin flows.
- Keep TypeScript and ESLint clean.

Implementation requirements:
- Use endpoint-specific TTLs (short for active/current, moderate for listings) and avoid caching error responses.
- Ensure cache headers are deterministic and not contradictory.
- Add guarded instrumentation logs/headers for cache hit/miss visibility in non-production or debug mode.

Acceptance criteria:
- Public announcement/event endpoints return intended cache headers and revalidate correctly.
- Admin submissions endpoint remains private/no-store.
- TTL can be tuned via env without code changes.

Checks to run:
- pnpm lint
- pnpm test -- --runInBand
- Endpoint-level verification for headers/status/body consistency on all touched routes

Measurable outcomes:
- Reduced median response time for active announcements/current events endpoints.
- Reduced repeated DB/read load for cached routes under repeated requests.
- Zero cache leakage on admin/private endpoint.

Prompt 2:
Add regression tests around caching behavior for touched API routes.

Scope:
- Add/update tests to assert cache/no-store headers, status codes, and unchanged payload contracts for:
  - app/api/announcements/active/route.ts
  - app/api/events/route.ts
  - app/api/events/current/route.ts
  - app/api/admin/submissions/route.ts

Constraints:
- Keep tests deterministic and fast.
- Do not rewrite unrelated tests.

Acceptance criteria:
- Tests fail if private/admin endpoint becomes cacheable.
- Tests fail if public route cache policy deviates from configured strategy.

Checks to run:
- pnpm test -- --runInBand
- pnpm lint

Measurable outcomes:
- Automated coverage of cache policy regressions on all touched endpoints.

## Phase 3

Prompt 1:
Optimize ZE Club and homepage rendering costs without changing visible behavior.

Scope:
- Optimize components/ze-club/ZEClubLayout.tsx and components/Hyperspeed.tsx by reducing unnecessary rerenders, memoizing expensive computations, and deferring heavy visual work where safe.
- Optimize app/home-client.tsx and components/home/AnnouncementsSection.tsx for reduced client bundle and hydration work (lazy load non-critical sections/components as appropriate).
- Preserve current UX, animations, and data correctness.

Constraints:
- Preserve existing behavior and visual output.
- Do not break auth/admin flows.
- Keep TypeScript and ESLint clean.

Implementation requirements:
- Avoid premature micro-optimizations; focus on measurable hotspots.
- Use stable props/callbacks where rerender churn is currently high.
- Keep accessibility and reduced-motion behavior intact.

Acceptance criteria:
- No functional regressions in homepage or ZE Club flows.
- Noticeable reduction in initial client JS for non-critical modules and/or rerender counts in identified hotspots.

Checks to run:
- pnpm lint
- pnpm test -- --runInBand
- Build + performance smoke check (project-equivalent, e.g., pnpm build)

Measurable outcomes:
- Lower client-side scripting/hydration time on home and ZE Club pages.
- Improved render stability (fewer avoidable rerenders) in optimized components.

Prompt 2:
Add focused performance regression guards for optimized UI paths.

Scope:
- Add/update tests or lightweight assertions for rendering logic in:
  - components/ze-club/ZEClubLayout.tsx
  - components/Hyperspeed.tsx
  - components/home/AnnouncementsSection.tsx

Constraints:
- Keep tests maintainable; avoid snapshot bloat.
- No visual redesign.

Acceptance criteria:
- Tests catch accidental rerender-heavy prop/API changes where practical.

Checks to run:
- pnpm test -- --runInBand
- pnpm lint

Measurable outcomes:
- Performance-sensitive behavior covered by automated checks.

## Phase 4

Prompt 1:
Improve ZE Club API efficiency and consistency for dashboard/leaderboard endpoints with safe rollout controls.

Scope:
- Optimize app/api/ze-club/user/dashboard/route.ts and app/api/ze-club/leaderboard/route.ts by reducing duplicate queries, tightening projection/field selection, and improving response assembly efficiency.
- Apply endpoint-appropriate cache/revalidate strategy for public leaderboard data while keeping user dashboard private/no-store.
- Keep ranking and user-specific correctness intact.

Constraints:
- Preserve response schema and business logic outcomes.
- Do not break auth/admin flows.
- Keep TypeScript and ESLint clean.

Implementation requirements:
- Add feature-flag or env-guard for any risky query/caching change to allow quick rollback.
- Ensure leaderboard caching never leaks personalized fields.
- Keep error handling consistent with existing API style.

Acceptance criteria:
- Dashboard endpoint remains private and accurate per user.
- Leaderboard endpoint is faster under repeated reads and returns safe cache headers.
- No changes required by existing consumers due to schema drift.

Checks to run:
- pnpm lint
- pnpm test -- --runInBand
- Targeted API verification for dashboard/leaderboard correctness and cache policy

Measurable outcomes:
- Lower p95 response time for leaderboard under repeated traffic.
- Reduced DB load for leaderboard reads.
- Zero user-data leakage across cached responses.

Prompt 2:
Run an end-to-end validation pass for all phases and produce a concise implementation report in PR description format.

Scope:
- Validate security headers/CSP mode, API cache behavior, UI performance optimizations, and ZE Club endpoint correctness.
- Summarize changed files, before/after metrics, risk notes, and rollback toggles used.

Constraints:
- No additional feature changes; validation and reporting only.
- Keep TypeScript and ESLint clean.

Acceptance criteria:
- All checks pass, known risks are documented, and rollback switches are clearly listed.

Checks to run:
- pnpm lint
- pnpm test -- --runInBand
- pnpm build

Measurable outcomes:
- Single report includes per-phase metrics, pass/fail status, and rollback readiness.