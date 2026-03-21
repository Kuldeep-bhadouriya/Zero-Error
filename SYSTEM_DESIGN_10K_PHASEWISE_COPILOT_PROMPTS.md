# Phase 1 Prompt
You are implementing Phase 1: crash-prevention hardening for a Next.js + Vercel + MongoDB Atlas project.

Goal:
Prevent timeout/OOM cascades and stabilize under high concurrency without changing product behavior.

Scope:
1. Update lib/mongodb.ts:
- Configure explicit pool and timeout settings for both mongoose.connect and MongoClient.
- Add production-safe values for maxPoolSize, minPoolSize, maxIdleTimeMS, waitQueueTimeoutMS, serverSelectionTimeoutMS, socketTimeoutMS.
- Keep dev-mode global caching behavior intact.

2. Update lib/rate-limit.ts:
- Add cleanup for expired entries in local fallback Map.
- Add hard cap for local fallback store size.
- Ensure cleanup is lightweight and deterministic.
- Keep Upstash behavior unchanged when Redis env vars are present.

3. Update app/api/ze-club/leaderboard/route.ts:
- Remove full-dataset in-memory ranking from hot request path.
- Replace with DB-first pagination/ranking strategy using indexed cursor fields (experience + _id).
- Move zeTag normalization/backfill logic out of request path.
- Keep response schema backward compatible.

4. Update app/api/auth/[...nextauth]/route.ts:
- Remove unconditional DB writes in jwt callback.
- Only write when user fields actually changed.
- Limit profile refresh DB reads to explicit update trigger.
- Preserve login/session output fields and current auth behavior.

Constraints:
- No breaking API contract changes.
- No UI changes.
- Keep strict TypeScript and existing lint rules clean.

Validation:
- Run: pnpm lint
- Run: pnpm test
- Verify auth login/session flow still works.
- Verify leaderboard still paginates and returns expected fields.

Output format:
1. Apply changes directly.
2. Show grouped diff by file.
3. Give short before/after impact summary for each change.


# Phase 2 Prompt
You are implementing Phase 2: query and index optimization for p95 latency reduction.

Goal:
Reduce DB amplification on profile/reward/leaderboard flows and improve API latency headroom.

Scope:
1. Update lib/services/rewardService.ts:
- Replace per-request countUsersWithHigherExperience calls with short-TTL cached top-3 lookup (or equivalent O(1) eligibility strategy).
- Ensure top-3 exclusivity logic remains correct.
- Keep reward response contract unchanged.

2. Update app/api/ze-club/rewards/redeem/route.ts:
- Reuse the optimized top-3 check strategy.
- Keep stock, rank, and redemption correctness intact.
- Preserve error messages/status codes unless clearly incorrect.

3. Update app/api/user/profile/get/route.ts:
- Consolidate multiple countDocuments calls into an aggregate/facet approach where appropriate.
- Keep returned payload shape unchanged.
- Preserve auth and privacy behavior.

4. Update models for query-path indexes:
- models/user.ts: indexes for leaderboard cursor and top-user lookups.
- models/missionSubmission.ts: indexes for frequent status/user/mission lookups.
- models/reward.ts: indexes for active/stock/eligibility filters.
- Do not remove existing required indexes.

Constraints:
- Do not alter business logic semantics.
- Keep compatibility with existing pages/components.

Validation:
- Run: pnpm lint
- Run: pnpm test
- Add or update targeted tests for reward eligibility and profile stats correctness if needed.

Output format:
1. Apply code changes.
2. Show grouped diff.
3. Provide expected latency/query-count improvements per endpoint.


# Phase 3 Prompt
You are implementing Phase 3: rendering and cache strategy for mixed read/write traffic.

Goal:
Reduce serverless + DB load on high-read routes while preserving correctness for write-sensitive flows.

Scope:
1. Audit and optimize rendering strategy in app routes:
- app/page.tsx
- app/events/page.tsx
- app/ze-club/rewards/page.tsx
- Other high-read public pages if relevant.

2. Convert suitable routes/pages from always-dynamic to ISR/revalidate windows.
- Keep personalized/private data as no-store where required.
- Avoid stale behavior for write-sensitive ZE Club actions.

3. Update cache invalidation strategy:
- Narrow cache invalidation scope in lib/userService.ts and related call sites.
- Avoid global cache clears when only one user/entity changed.

4. Keep auth-safe rate-limit behavior in proxy.ts:
- Ensure frequent auth session/provider/csrf endpoints are not wrongly throttled.
- Keep strict limits on abuse-prone write endpoints.

Constraints:
- No regression in auth/admin/mission/reward correctness.
- Maintain existing payload shapes and user-visible behavior.

Validation:
- Run: pnpm lint
- Run: pnpm test
- Run: pnpm build
- Verify cache headers and route behavior for key endpoints.

Output format:
1. Apply changes.
2. Show diff grouped by rendering, caching, and rate-limit updates.
3. Provide a short table: route -> old mode -> new mode -> reason.


# Phase 4 Prompt
You are implementing Phase 4: reliability guardrails and observability.

Goal:
Make high-traffic behavior measurable and fail-safe so spikes do not crash the app.

Scope:
1. Add endpoint-level SLO instrumentation in lib/api/middleware.ts:
- Capture route-level latency (p50/p95-friendly logs), status class, and error counts.
- Keep logs structured and production-safe.
- Do not log sensitive user data.

2. Add graceful degradation/circuit-break behavior for non-critical heavy features:
- Prioritize leaderboard/media-heavy blocks fallback behavior under stress.
- Return safe degraded responses instead of timeouts when possible.

3. Add/update load-test scripts under tests and/or scripts:
- Cover core journeys: home browse, events listing, auth/session check, leaderboard read, mission submit/redeem.
- Provide staged profile targets: 500, 2000, 5000, 10000 concurrent users.

4. Add brief runbook file for incident actions:
- Fast rollback toggles, cache disable path, limiter fallback behavior, and key dashboard metrics.

Constraints:
- Keep codebase style and existing tooling.
- No unnecessary refactors outside scoped reliability work.

Validation:
- Run: pnpm lint
- Run: pnpm test
- Run: pnpm build
- Execute at least one load-test scenario and report key results.

Output format:
1. Apply all changes.
2. Show grouped diff.
3. Report metrics captured and fallback behavior introduced.


# Phase 5 Prompt
You are implementing Phase 5: cost-aware production scaling gates and rollout controls.

Goal:
Enable safe growth from free tier to paid infra only when metrics justify it.

Scope:
1. Add configurable scaling thresholds via environment variables:
- p95 latency threshold
- error-rate threshold
- DB wait/timeout threshold
- cache hit-rate threshold

2. Add feature flags for risky/high-impact changes:
- leaderboard query strategy toggle
- cache strategy toggle
- fallback degradation toggle

3. Add rollout plan doc in repository:
- phased deployment order
- rollback instructions per phase
- success/failure criteria per phase

4. Add verification checklist for production:
- pre-deploy checks
- post-deploy checks (latency, errors, auth flow, mission/reward correctness)

Constraints:
- Keep runtime overhead minimal.
- Keep defaults aligned with low-cost-first strategy.

Validation:
- Run: pnpm lint
- Run: pnpm test
- Run: pnpm build

Output format:
1. Apply changes.
2. Show grouped diff.
3. Provide final go-live checklist.


# Full Implementation Prompt
Implement the complete 10k-concurrency system design roadmap end-to-end in phased commits.

Project context:
- Deployment: Vercel
- Database: MongoDB Atlas free tier
- Traffic pattern: mixed read/write
- Target: API p95 < 500ms
- Priority: low-cost-first, upgrade infra only after code-level optimization

Required phases:
1. Crash-prevention hardening (DB pool/timeouts, rate-limit fallback bounds, leaderboard hot-path fix, auth callback load reduction).
2. Query/index optimization (reward top-3 check optimization, profile aggregate optimization, index tuning).
3. Rendering/cache optimization (ISR/revalidate for high-read paths, scoped cache invalidation, auth-safe throttling).
4. Reliability guardrails (SLO instrumentation, graceful degradation, load-test coverage).
5. Rollout controls (env thresholds, feature flags, rollback + verification runbook).

Hard constraints:
- Preserve API response contracts unless absolutely required.
- No auth/admin flow breakage.
- Keep ZE Club correctness for missions, rewards, leaderboard rank semantics.
- Keep TypeScript, lint, and tests passing.

Execution requirements:
- Implement phase by phase with clear grouped diffs.
- After each phase, run lint/tests and summarize pass/fail + risk.
- If a phase introduces risk, add feature flag before enabling by default.

Final output:
1. Phase-wise change summary with impacted files.
2. Validation results (lint/test/build/load checks).
3. Before/after risk and performance summary.
4. Remaining known risks and next recommended actions.