# Discord Rank Sync Runbook (Phase 8)

This runbook covers production hardening, rollout, and incident response for website-to-Discord rank sync.

## Safety Gates

- Do not enable production role mutation before staging dry-run passes.
- Use limited cohort rollout before full enablement.
- Keep website rank authoritative. Discord is a projection.

## Required Environment Variables

### Website (Next.js)

- DISCORD_SYNC_ENABLED
- DISCORD_SYNC_DRY_RUN
- DISCORD_RECONCILE_ENABLED
- DISCORD_ACTIVITY_POINTS_ENABLED
- INTERNAL_SERVICE_TOKEN
- INTERNAL_SIGNING_SECRET
- INTERNAL_REQUEST_MAX_AGE_SECONDS

### Bot Worker

- DISCORD_BOT_TOKEN
- INTERNAL_API_BASE_URL
- INTERNAL_SERVICE_TOKEN
- INTERNAL_SIGNING_SECRET
- DISCORD_SYNC_ENABLED
- DISCORD_SYNC_DRY_RUN
- DISCORD_SYNC_GUILD_ID
- DISCORD_CLAIM_BATCH_SIZE
- DISCORD_POLL_INTERVAL_MS
- DISCORD_ACTION_DELAY_MS
- DISCORD_RETRY_BASE_SECONDS
- DISCORD_RETRY_MAX_SECONDS
- DISCORD_CLAIM_ERROR_BACKOFF_MS
- DISCORD_RECONCILE_ENABLED
- DISCORD_RECONCILE_INTERVAL_MS
- DISCORD_RECONCILE_DRY_RUN
- DISCORD_RECONCILE_TARGET_USER_ID
- DISCORD_RECONCILE_SCAN_LIMIT
- LOG_LEVEL

## Deployment Steps (Bot)

1. Build and push bot image/artifact from bot root.
2. Set all required env vars in staging.
3. Start with:
   - DISCORD_SYNC_ENABLED=true
   - DISCORD_SYNC_DRY_RUN=true
   - DISCORD_RECONCILE_ENABLED=false
4. Verify logs show claims/completions with dry-run notes and no role mutations.
5. Enable limited cohort:
   - keep dry-run on globally
   - run targeted reconcile with DISCORD_RECONCILE_TARGET_USER_ID for selected users
6. Move limited cohort to live mutation:
   - DISCORD_SYNC_DRY_RUN=false
   - monitor failed/dead-letter jobs and dashboard/admin status
7. Enable reconciliation after sync health is stable:
   - DISCORD_RECONCILE_ENABLED=true
   - DISCORD_RECONCILE_DRY_RUN=true initially
8. Switch reconcile to live corrective mode after validation:
   - DISCORD_RECONCILE_DRY_RUN=false
9. Optional Phase 9 rollout (Discord activity points):
   - DISCORD_ACTIVITY_POINTS_ENABLED=true only after anti-abuse checks are validated in staging
   - keep limited cohort and monitor activity ledger outcomes before full enablement

## Observability and Logging Guidance

Logs should include:

- correlationId
- serviceName or workerId
- jobId, guildId, userId, discordId
- source, attemptCount, maxAttempts
- errorCode and retry/dead-letter metadata

Logs must not include:

- INTERNAL_SERVICE_TOKEN
- INTERNAL_SIGNING_SECRET
- raw request signatures
- OAuth access tokens

## Incident Response

### Symptom: Growing failed or dead-letter jobs

1. Check admin failed jobs list.
2. Group by errorCode and guildId.
3. Common classes:
   - missing mapping: no_role_mapping
   - member not found: discord_api_10007
   - permission issues: discord_api_50013 or 50001
4. Fix root cause (mapping, bot permissions, membership).
5. Retry from admin UI or run targeted reconcile.

### Symptom: Internal API auth failures

1. Validate INTERNAL_SERVICE_TOKEN and INTERNAL_SIGNING_SECRET parity between website and bot.
2. Check INTERNAL_REQUEST_MAX_AGE_SECONDS for clock skew tolerance.
3. Confirm request signatures are generated from method + path + body hash.
4. Rotate secrets if compromise is suspected.

### Emergency Rollback

1. Set DISCORD_SYNC_ENABLED=false on website and bot.
2. Keep DISCORD_RECONCILE_ENABLED=false.
3. Set DISCORD_ACTIVITY_POINTS_ENABLED=false.
4. Preserve job and activity ledger data for audit; do not delete queues.
5. Re-enable in dry-run after remediation.

## Backward Compatibility Notes

- DISCORD_SYNC_ENABLED defaults to true for existing deployments.
- DISCORD_SYNC_DRY_RUN defaults to false.
- DISCORD_RECONCILE_ENABLED defaults to false.
- DISCORD_ACTIVITY_POINTS_ENABLED defaults to false.
- Existing linked users and mission flows remain unchanged.
