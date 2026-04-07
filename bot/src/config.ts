import os from 'os'
import { config as loadDotEnv } from 'dotenv'
import { z } from 'zod'

loadDotEnv()

const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().trim().min(1, 'DISCORD_BOT_TOKEN is required'),
  INTERNAL_API_BASE_URL: z.string().trim().url('INTERNAL_API_BASE_URL must be a valid URL'),
  INTERNAL_SERVICE_TOKEN: z.string().trim().min(1, 'INTERNAL_SERVICE_TOKEN is required'),
  INTERNAL_SIGNING_SECRET: z.string().trim().min(1, 'INTERNAL_SIGNING_SECRET is required'),
  DISCORD_WORKER_ID: z.string().trim().min(1).optional(),
  DISCORD_SYNC_GUILD_ID: z.string().trim().min(1).optional(),
  DISCORD_CLAIM_BATCH_SIZE: z.coerce.number().int().min(1).max(10).default(3),
  DISCORD_POLL_INTERVAL_MS: z.coerce.number().int().min(250).max(60000).default(2000),
  DISCORD_ACTION_DELAY_MS: z.coerce.number().int().min(0).max(15000).default(250),
  DISCORD_RETRY_BASE_SECONDS: z.coerce.number().int().min(5).max(3600).default(30),
  DISCORD_RETRY_MAX_SECONDS: z.coerce.number().int().min(10).max(7200).default(1800),
  DISCORD_CLAIM_ERROR_BACKOFF_MS: z.coerce.number().int().min(250).max(60000).default(5000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type WorkerConfig = {
  discordBotToken: string
  internalApiBaseUrl: string
  internalServiceToken: string
  internalSigningSecret: string
  workerId: string
  serviceName: string
  guildId?: string
  claimBatchSize: number
  pollIntervalMs: number
  actionDelayMs: number
  retryBaseSeconds: number
  retryMaxSeconds: number
  claimErrorBackoffMs: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export function loadWorkerConfig(): WorkerConfig {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid bot env: ${issues}`)
  }

  const env = parsed.data
  const workerId = env.DISCORD_WORKER_ID || `${os.hostname()}-${process.pid}`

  return {
    discordBotToken: env.DISCORD_BOT_TOKEN,
    internalApiBaseUrl: env.INTERNAL_API_BASE_URL.replace(/\/+$/, ''),
    internalServiceToken: env.INTERNAL_SERVICE_TOKEN,
    internalSigningSecret: env.INTERNAL_SIGNING_SECRET,
    workerId,
    serviceName: 'discord-sync-worker',
    guildId: env.DISCORD_SYNC_GUILD_ID,
    claimBatchSize: env.DISCORD_CLAIM_BATCH_SIZE,
    pollIntervalMs: env.DISCORD_POLL_INTERVAL_MS,
    actionDelayMs: env.DISCORD_ACTION_DELAY_MS,
    retryBaseSeconds: env.DISCORD_RETRY_BASE_SECONDS,
    retryMaxSeconds: env.DISCORD_RETRY_MAX_SECONDS,
    claimErrorBackoffMs: env.DISCORD_CLAIM_ERROR_BACKOFF_MS,
    logLevel: env.LOG_LEVEL,
  }
}
