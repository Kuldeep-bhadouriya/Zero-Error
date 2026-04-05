# Discord Rank Sync - Phase-Wise Implementation Prompts

## Purpose
This document converts the approved architecture plan into phase-by-phase implementation prompts you can run with Copilot/Coding Agent.

It is tailored to the current Zero-Error codebase and stack.

## Current Stack Analysis (Verified)
- Frontend/API: Next.js App Router (`app/`) with TypeScript.
- Auth: NextAuth v5 with Discord OAuth already configured in `app/api/auth/[...nextauth]/route.ts`.
- Database: MongoDB + Mongoose models in `models/`.
- Rank logic: Rank thresholds in `lib/ranks.ts`, rank derivation in `lib/services/rankService.ts`.
- Existing points updates: Mission approval/revert flow in `lib/services/missionService.ts`.
- Security patterns: API wrappers in `lib/api/middleware.ts`, Zod helpers in `lib/validation.ts`, global rate limiting and CSRF in `proxy.ts` and `lib/rate-limit.ts`.
- Logging: Structured logger in `lib/logger.ts`.

## Architecture Decision (Best Fit for This Repo)
- Source of truth: Website rank is authoritative.
- Role policy: Exactly one active rank role in Discord per user.
- Phase 1 points source: Website actions/missions only.
- Deployment: Hybrid model.
  - Keep website on Vercel.
  - Run Discord bot as a long-running service (Railway/Fly/VM) using Discord.js.
- Sync strategy: Event-driven updates on rank change + scheduled reconciliation.

## Delivery Rules for Every Phase
1. Reuse existing patterns and naming conventions.
2. Keep route handlers wrapped by `withErrorHandling` and `withAuth/withAdmin` where needed.
3. Validate all request payloads with Zod.
4. Add explicit rate-limit rules for new public and internal endpoints.
5. Add tests for each phase before considering it complete.

---

## Phase 1 - Domain Model and Configuration Foundation

### Goal
Create the data contracts needed for Discord linkage, rank-role mapping, and sync lifecycle state.

### Expected Output
- User schema extensions for Discord verification and sync status.
- New guild configuration model for rank-to-role mapping.
- New sync job/outbox model for durable role updates.

### Prompt (Copy/Paste)
```text
Implement Phase 1 for Discord rank-role sync in the Zero-Error repo.

Requirements:
1) Extend `models/user.ts` with Discord sync metadata fields while keeping backward compatibility with existing `discordId`.
2) Add a new model for Discord guild config and rank-to-role mapping (do not overload `models/siteSetting.ts`).
3) Add a new model for sync jobs/outbox with status, retry metadata, idempotency key, and timestamps.
4) Ensure indexes for lookup and uniqueness are present (e.g., user+guild constraints, idempotency key uniqueness).
5) Keep TypeScript types aligned with schema changes.
6) Add integration tests for model validation and index behavior.

Constraints:
- Reuse the rank names from `lib/ranks.ts`.
- Keep existing auth/rank behavior unchanged.
- Do not introduce breaking schema migration assumptions.

Deliverables:
- New/updated model files
- Test files
- Short migration/backfill note in comments or docs
```

### Definition of Done
- Models compile and tests pass.
- No regressions in existing auth and ZE Club flows.

---

## Phase 2 - User Linking and Verification APIs

### Goal
Implement secure user-facing APIs to link/unlink Discord and read sync status.

### Expected Output
- `link/start`, `link/callback`, `unlink`, `status` endpoints.
- Verified-link state machine in user records.

### Prompt (Copy/Paste)
```text
Implement Phase 2: Discord account link/unlink/status APIs.

Requirements:
1) Add user endpoints under `app/api/user/discord/`:
   - `link/start`
   - `link/callback`
   - `unlink`
   - `status`
2) Reuse existing middleware patterns from `lib/api/middleware.ts`.
3) Validate all payloads with `lib/validation.ts` style Zod schemas.
4) Prevent duplicate link conflicts:
   - Same Discord account cannot link to multiple website users.
   - Handle existing `discordId` records safely.
5) Add rate limiting for these routes in `lib/rate-limit.ts`.
6) Ensure CSRF behavior remains compatible with `proxy.ts`.
7) Add integration tests for successful link, duplicate conflict, unlink safeguards, and unauthorized access.

Constraints:
- Keep NextAuth Discord provider in `app/api/auth/[...nextauth]/route.ts` as identity bootstrap.
- Only verified linked users are eligible for role sync.
```

### Definition of Done
- Endpoints are secured, validated, and tested.
- Link status is queryable for dashboard use.

---

## Phase 3 - Internal Service Auth and Bot API Contracts

### Goal
Create secure internal endpoints for bot worker communication.

### Expected Output
- Internal auth middleware for bot requests.
- Job claim/complete/fail endpoints.

### Prompt (Copy/Paste)
```text
Implement Phase 3: internal bot APIs with service authentication.

Requirements:
1) Add internal endpoints under `app/api/internal/discord-sync/`:
   - `jobs/claim`
   - `jobs/[jobId]/complete`
   - `jobs/[jobId]/fail`
   - `reconcile` (manual trigger endpoint)
2) Add a middleware helper for service-to-service auth (token + HMAC signature + timestamp window).
3) Enforce replay protection and strict request validation.
4) Add dedicated internal rate-limit rules in `lib/rate-limit.ts`.
5) Use structured logging via `lib/logger.ts` including correlation IDs.
6) Add integration tests for invalid signature, expired timestamp, unauthorized access, and success paths.

Constraints:
- Keep internal endpoints inaccessible to normal session auth users.
- Return consistent API response shape aligned with existing patterns.
```

### Definition of Done
- Bot endpoints are secure, test-covered, and ready for worker integration.

---

## Phase 4 - Rank Change Event Enqueue in Website Flows

### Goal
Emit durable sync jobs whenever rank changes in the website.

### Expected Output
- Enqueue helper service.
- Hooked into mission approval/revert paths.

### Prompt (Copy/Paste)
```text
Implement Phase 4: enqueue sync jobs when website rank changes.

Requirements:
1) Create a sync enqueue service in `lib/services/` that writes to the sync job model.
2) Integrate into rank mutation paths, starting with `lib/services/missionService.ts` after `applyRankFromExperience()`.
3) Enqueue only when rank actually changes and user has verified Discord linkage.
4) Generate idempotency keys to prevent duplicate churn.
5) Add logs for enqueue events and reasons when enqueue is skipped.
6) Add unit and integration tests for rank-change detection and enqueue behavior.

Constraints:
- No direct Discord API calls from website routes/services.
- Keep existing mission behavior and responses intact.
```

### Definition of Done
- Rank changes produce durable jobs consistently.
- Existing mission tests remain green.

---

## Phase 5 - Discord.js Bot Worker Service

### Goal
Build the long-running Discord bot that applies/removes roles based on claimed jobs.

### Expected Output
- New `bot/` service package.
- Worker loop with retry and dead-letter handling.

### Prompt (Copy/Paste)
```text
Implement Phase 5: Discord.js worker service in this repository.

Requirements:
1) Add a `bot/` package with TypeScript + Node 20 + Discord.js v14.
2) Implement worker loop:
   - Claim jobs from internal API
   - Resolve guild member
   - Remove old rank roles
   - Assign expected rank role
   - Mark complete/fail with reason
3) Add retry strategy (exponential backoff) and dead-letter final state.
4) Add structured logs compatible with existing logging style.
5) Add env validation for bot secrets and internal API auth secrets.
6) Add local run scripts and deployment notes (Railway/Fly/VM).

Constraints:
- Website remains deployed on Vercel.
- Bot must be stateless and restart-safe.
- Respect Discord API rate limits.
```

### Definition of Done
- Worker can process jobs end-to-end in staging.
- Failed jobs retry and eventually dead-letter with clear diagnostics.

---

## Phase 6 - Dashboard and Admin Visibility

### Goal
Expose Discord link and sync health in user/admin surfaces.

### Expected Output
- Dashboard API includes link/sync status.
- UI status card in ZE Club dashboard.

### Prompt (Copy/Paste)
```text
Implement Phase 6: user/admin visibility for Discord sync state.

Requirements:
1) Extend `app/api/ze-club/user/dashboard/route.ts` with Discord link/sync fields.
2) Update `components/ze-club/Dashboard.tsx` to show:
   - Linked/unlinked state
   - Verified state
   - Last sync time
   - Last error (if any)
3) Add an admin route/view to inspect failed sync jobs and trigger retry/reconcile.
4) Keep UI responsive and consistent with existing ZE Club patterns.
5) Add tests for dashboard payload changes and key UI states.

Constraints:
- Do not expose internal secrets or sensitive sync internals to users.
- Preserve current dashboard performance.
```

### Definition of Done
- Users can see role-sync health clearly.
- Admin has minimal operational controls for failures.

---

## Phase 7 - Scheduled Reconciliation and Drift Repair

### Goal
Continuously self-heal mismatches between website rank and Discord roles.

### Expected Output
- Reconciliation job runner.
- Drift detection and corrective sync actions.

### Prompt (Copy/Paste)
```text
Implement Phase 7: periodic reconciliation and drift repair.

Requirements:
1) Add reconciliation logic that scans eligible linked users and compares expected rank role vs actual Discord role.
2) Enqueue corrective jobs for mismatches.
3) Add execution modes:
   - scheduled run
   - targeted user run
   - dry-run mode for safe validation
4) Add reporting metrics:
   - scanned users
   - mismatches found
   - corrected count
   - failed count
5) Add tests for drift detection and correction behavior.

Constraints:
- Website rank remains authoritative.
- Reconciliation must be idempotent and safe to rerun.
```

### Definition of Done
- Drift is automatically detected and corrected.
- Dry-run output is clear for operations review.

---

## Phase 8 - Security Hardening, Testing, and Rollout

### Goal
Ship safely with feature flags, robust tests, and observability.

### Expected Output
- Full test matrix.
- Feature-flag rollout plan.
- Operational runbook.

### Prompt (Copy/Paste)
```text
Implement Phase 8: production hardening and rollout.

Requirements:
1) Add feature flags for:
   - sync enable/disable
   - dry-run mode
   - reconciliation enable/disable
2) Add end-to-end staging test scenario:
   - user links Discord
   - user gains website points and rank changes
   - Discord role updates
3) Add failure scenario tests:
   - missing role mapping
   - Discord member not found
   - API signature invalid
   - rate-limited responses
4) Add runbook documentation:
   - required env vars
   - deployment steps for bot
   - incident response for failed syncs
5) Ensure logs include enough data for debugging without exposing secrets.

Constraints:
- No production enable until dry-run and limited cohort pass.
- Keep backward compatibility with existing users.
```

### Definition of Done
- Rollout can proceed in controlled stages with low risk.

---

## Optional Phase 9 - Discord Activity Points (Future)

### Goal
Allow Discord activity to contribute to points, with abuse protection.

### Prompt (Copy/Paste)
```text
Implement Optional Phase 9: Discord activity-based points.

Requirements:
1) Add internal ingestion endpoint for bot-reported activity events.
2) Define scoring rules and anti-abuse controls (cooldowns, caps, duplicate suppression).
3) Write activity transactions to a dedicated ledger model (auditable).
4) Apply points to user experience and trigger rank sync enqueue.
5) Add tests for abuse prevention and rank progression correctness.

Constraints:
- Keep this feature behind a disabled-by-default flag.
- Preserve website mission points logic as-is.
```

---

## Suggested Environment Variables (Planned)
- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `INTERNAL_SERVICE_TOKEN`
- `INTERNAL_SIGNING_SECRET`
- `DISCORD_SYNC_ENABLED`
- `DISCORD_SYNC_DRY_RUN`
- `DISCORD_RECONCILE_ENABLED`

## Suggested Final Milestone Checklist
1. All phases complete with tests passing.
2. Staging dry-run successful with real Discord test server.
3. Limited cohort rollout completed without critical errors.
4. Full rollout enabled and monitored.
5. Post-launch audit confirms role sync reliability and security.
