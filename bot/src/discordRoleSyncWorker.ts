import {
  Client,
  DiscordAPIError,
  GatewayIntentBits,
  RESTEvents,
  type GuildMember,
} from 'discord.js'
import type { Logger } from 'pino'
import type { WorkerConfig } from './config.js'
import { InternalApiClient } from './internalApi.js'
import type { ClaimedSyncJob } from './types.js'
import { calculateRetryDelaySeconds, createCorrelationId, sleep } from './utils.js'

const NON_RETRIABLE_DISCORD_ERROR_CODES = new Set([10007, 10011, 50001, 50013])

export class DiscordRoleSyncWorker {
  private readonly client: Client
  private keepRunning = true
  private loopPromise: Promise<void> | null = null

  constructor(
    private readonly config: WorkerConfig,
    private readonly apiClient: InternalApiClient,
    private readonly logger: Logger
  ) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    })

    this.client.rest.on(RESTEvents.RateLimited, (rateLimitData) => {
      this.logger.warn(
        {
          timeoutMs: rateLimitData.timeout,
          limit: rateLimitData.limit,
          method: rateLimitData.method,
          route: rateLimitData.route,
          global: rateLimitData.global,
        },
        'Discord REST rate limited'
      )
    })

    this.client.on('error', (error) => {
      this.logger.error({ err: error }, 'Discord client emitted error')
    })
  }

  async start() {
    await this.client.login(this.config.discordBotToken)
    await this.waitForReady()

    this.logger.info(
      {
        workerId: this.config.workerId,
        guildScope: this.config.guildId || null,
        batchSize: this.config.claimBatchSize,
      },
      'Discord sync worker started'
    )

    this.loopPromise = this.runLoop()
    return this.loopPromise
  }

  async stop() {
    this.keepRunning = false
    if (this.loopPromise) {
      await this.loopPromise
    }
    this.client.destroy()
  }

  private waitForReady() {
    if (this.client.isReady()) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.client.once('ready', () => {
        this.logger.info({ userTag: this.client.user?.tag || null }, 'Discord bot ready')
        resolve()
      })
    })
  }

  private async runLoop() {
    while (this.keepRunning) {
      const claimCorrelationId = createCorrelationId('claim')

      try {
        const claimedJobs = await this.apiClient.claimJobs({
          workerId: this.config.workerId,
          guildId: this.config.guildId,
          limit: this.config.claimBatchSize,
          correlationId: claimCorrelationId,
        })

        if (claimedJobs.length === 0) {
          await sleep(this.config.pollIntervalMs)
          continue
        }

        for (const job of claimedJobs) {
          if (!this.keepRunning) {
            break
          }

          await this.processJob(job)

          if (this.config.actionDelayMs > 0) {
            await sleep(this.config.actionDelayMs)
          }
        }
      } catch (error) {
        this.logger.error(
          {
            err: error,
            correlationId: claimCorrelationId,
          },
          'Claim loop failed; backing off'
        )

        await sleep(this.config.claimErrorBackoffMs)
      }
    }
  }

  private async processJob(job: ClaimedSyncJob) {
    const correlationId = job.correlationId || createCorrelationId(`job-${job.id}`)

    try {
      const member = await this.resolveMember(job)
      await this.syncMemberRankRoles(member, job, correlationId)

      await this.apiClient.completeJob({
        jobId: job.id,
        correlationId,
        payload: {
          note: `Assigned role ${job.targetRoleId} for rank ${job.targetRank}`,
        },
      })

      this.logger.info(
        {
          correlationId,
          jobId: job.id,
          guildId: job.guildId,
          discordId: job.discordId,
          targetRoleId: job.targetRoleId,
          targetRank: job.targetRank,
          attemptCount: job.attemptCount,
        },
        'Discord sync job completed successfully'
      )
    } catch (error) {
      const classified = this.classifyJobError(error)
      const retryDelaySeconds = calculateRetryDelaySeconds(
        job.attemptCount,
        this.config.retryBaseSeconds,
        this.config.retryMaxSeconds
      )

      try {
        await this.apiClient.failJob({
          jobId: job.id,
          correlationId,
          payload: {
            error: classified.message,
            errorCode: classified.code,
            retryDelaySeconds,
            deadLetter: classified.deadLetter,
          },
        })
      } catch (reportError) {
        this.logger.error(
          {
            correlationId,
            jobId: job.id,
            err: reportError,
          },
          'Failed reporting Discord sync failure to internal API'
        )
      }

      this.logger.warn(
        {
          correlationId,
          jobId: job.id,
          guildId: job.guildId,
          discordId: job.discordId,
          errorCode: classified.code,
          deadLetter: classified.deadLetter,
          retryDelaySeconds,
        },
        'Discord sync job failed'
      )
    }
  }

  private async resolveMember(job: ClaimedSyncJob) {
    const guild = await this.client.guilds.fetch(job.guildId)
    return guild.members.fetch(job.discordId)
  }

  private async syncMemberRankRoles(
    member: GuildMember,
    job: ClaimedSyncJob,
    correlationId: string
  ) {
    const rankRoleIds = Array.from(new Set(job.rankRoleIds && job.rankRoleIds.length > 0
      ? job.rankRoleIds
      : [job.targetRoleId]))

    const rolesToRemove = rankRoleIds.filter(
      (roleId) => roleId !== job.targetRoleId && member.roles.cache.has(roleId)
    )

    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove, 'Zero Error rank-role sync replacing previous rank role')
    }

    if (!member.roles.cache.has(job.targetRoleId)) {
      await member.roles.add(job.targetRoleId, 'Zero Error rank-role sync target rank assignment')
    }

    this.logger.debug(
      {
        correlationId,
        guildId: job.guildId,
        discordId: job.discordId,
        removedRoleCount: rolesToRemove.length,
        targetRoleId: job.targetRoleId,
      },
      'Discord member rank roles synchronized'
    )
  }

  private classifyJobError(error: unknown) {
    if (error instanceof DiscordAPIError) {
      const deadLetter = NON_RETRIABLE_DISCORD_ERROR_CODES.has(error.code)
      return {
        message: `Discord API error: ${error.message}`,
        code: `discord_api_${error.code}`,
        deadLetter,
      }
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'worker_error',
        deadLetter: false,
      }
    }

    return {
      message: 'Unknown worker error',
      code: 'unknown_error',
      deadLetter: false,
    }
  }
}
