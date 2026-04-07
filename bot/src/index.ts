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
      internalApiBaseUrl: config.internalApiBaseUrl,
      guildScope: config.guildId || null,
    },
    'Initializing Discord sync worker'
  )

  const apiClient = new InternalApiClient(config, logger)
  const worker = new DiscordRoleSyncWorker(config, apiClient, logger)

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true

    logger.info({ signal }, 'Shutdown requested, stopping worker')
    await worker.stop()
    logger.info('Discord sync worker stopped')
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT').finally(() => process.exit(0))
  })

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM').finally(() => process.exit(0))
  })

  await worker.start()
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Discord sync worker failed to start', error)
  process.exit(1)
})
