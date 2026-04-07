import { loadWorkerConfig } from './config.js'
import { InternalApiClient } from './internalApi.js'
import { createLogger } from './logger.js'
import { DiscordRoleSyncWorker } from './discordRoleSyncWorker.js'

async function main() {
  const config = loadWorkerConfig()
  const logger = createLogger(config.logLevel)

  logger.info(
    {
      workerId: config.workerId,
      guildScope: config.guildId || null,
      targetUserId: config.reconcileTargetUserId || null,
      dryRun: config.reconcileDryRun,
    },
    'Initializing one-off Discord reconcile run'
  )

  const apiClient = new InternalApiClient(config, logger)
  const worker = new DiscordRoleSyncWorker(config, apiClient, logger)

  await worker.start({ startLoop: false })

  try {
    const metrics = await worker.runReconciliationCycle({
      mode: config.reconcileTargetUserId ? 'targeted' : 'scheduled',
      dryRun: config.reconcileDryRun,
      targetUserId: config.reconcileTargetUserId,
    })

    logger.info({ metrics }, 'One-off reconcile run finished')
  } finally {
    await worker.stop()
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('One-off reconcile run failed', error)
  process.exit(1)
})
