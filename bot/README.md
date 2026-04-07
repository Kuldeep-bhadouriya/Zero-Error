# Discord Sync Worker (Phase 5)

This package runs a stateless Discord.js v14 worker that:

1. Claims sync jobs from website internal APIs.
2. Resolves guild members.
3. Removes existing rank roles.
4. Assigns the expected rank role.
5. Marks jobs complete/fail with retry metadata.
6. Optionally runs periodic drift reconciliation (expected rank role vs actual Discord roles).

The website remains on Vercel. This worker is intended for Railway, Fly.io, or a VM.

## Requirements

- Node.js 20+
- Discord bot token with `Guilds` and member management permissions
- Website internal service auth secrets

## Local Run

1. Install dependencies:

```bash
pnpm --dir bot install
```

2. Configure environment:

```bash
cp bot/.env.example bot/.env
```

3. Run in watch mode:

```bash
pnpm --dir bot dev
```

4. Production build/start:

```bash
pnpm --dir bot build
pnpm --dir bot start
```

## Scripts

- `dev`: start worker in watch mode via `tsx watch`
- `worker`: run worker once via `tsx`
- `reconcile`: run one-off drift reconciliation scan (supports targeted user + dry-run)
- `build`: compile TypeScript to `dist/`
- `start`: run compiled worker
- `typecheck`: run TypeScript checks without emit

## Environment Variables

- `DISCORD_BOT_TOKEN`: Discord bot token.
- `INTERNAL_API_BASE_URL`: Website base URL, e.g. `https://your-site.vercel.app`.
- `INTERNAL_SERVICE_TOKEN`: Must match website `INTERNAL_SERVICE_TOKEN`.
- `INTERNAL_SIGNING_SECRET`: Must match website `INTERNAL_SIGNING_SECRET`.
- `DISCORD_SYNC_ENABLED`: Global sync switch for claim + role mutation paths.
- `DISCORD_SYNC_DRY_RUN`: Global dry-run switch. Jobs complete with dry-run notes and no Discord mutation.
- `DISCORD_WORKER_ID`: Worker identity sent to claim endpoint.
- `DISCORD_SYNC_GUILD_ID`: Optional; if set, worker only claims jobs for one guild.
- `DISCORD_CLAIM_BATCH_SIZE`: Number of jobs per claim request.
- `DISCORD_POLL_INTERVAL_MS`: Idle poll interval between claim attempts.
- `DISCORD_ACTION_DELAY_MS`: Delay between job executions to smooth API pressure.
- `DISCORD_RETRY_BASE_SECONDS`: Exponential retry base.
- `DISCORD_RETRY_MAX_SECONDS`: Max retry delay in seconds.
- `DISCORD_CLAIM_ERROR_BACKOFF_MS`: Delay after claim API failures.
- `DISCORD_RECONCILE_ENABLED`: Enable periodic reconciliation loop inside worker.
- `DISCORD_RECONCILE_INTERVAL_MS`: Interval between scheduled reconcile scans.
- `DISCORD_RECONCILE_DRY_RUN`: Reconcile-specific dry-run override (falls back to `DISCORD_SYNC_DRY_RUN`).
- `DISCORD_RECONCILE_TARGET_USER_ID`: Optional user id for targeted one-off reconcile runs.
- `DISCORD_RECONCILE_SCAN_LIMIT`: Max candidates fetched per scheduled scan.
- `LOG_LEVEL`: `debug`, `info`, `warn`, `error`.

## Reconciliation Modes

- Scheduled run: set `DISCORD_RECONCILE_ENABLED=true` and worker periodically scans candidates, compares actual Discord roles, and enqueues fixes for drift.
- Targeted user run: set `DISCORD_RECONCILE_TARGET_USER_ID=<userId>` and run `pnpm --dir bot reconcile`.
- Dry-run: set `DISCORD_RECONCILE_DRY_RUN=true` to report metrics without queueing correction jobs.

## Rollout Safety

- Do not enable production sync until staging dry-run and limited cohort checks pass.
- Recommended sequence: `DISCORD_SYNC_ENABLED=true` + `DISCORD_SYNC_DRY_RUN=true` first, then disable dry-run for limited cohort, then full rollout.

## Deployment Notes

### Railway

1. Create a new service from this repository.
2. Set root directory to `bot/`.
3. Set build command: `pnpm install && pnpm build`.
4. Set start command: `pnpm start`.
5. Configure all env vars listed above.

### Fly.io

1. Deploy with app root at `bot/`.
2. Build image with Node 20.
3. Start process: `pnpm start`.
4. Set env vars and a single replica initially.

### VM (systemd/pm2)

1. Install Node 20 + pnpm.
2. Run `pnpm --dir bot install && pnpm --dir bot build`.
3. Start with `pnpm --dir bot start` under process manager.
4. Configure restart-on-failure and centralized logs.

## Operational Notes

- Worker is stateless and restart-safe.
- Retry/backoff and dead-letter are delegated through internal fail endpoint.
- Discord.js handles HTTP rate limits; worker additionally processes jobs sequentially and delays between jobs.
