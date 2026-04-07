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
import { evaluateRoleDrift } from './reconcileDrift.js'
import type { ClaimedSyncJob, ReconcileRunMetrics } from './types.js'
import { calculateRetryDelaySeconds, createCorrelationId, sleep } from './utils.js'

const NON_RETRIABLE_DISCORD_ERROR_CODES = new Set([10007, 10011, 50001, 50013])

export class DiscordRoleSyncWorker {
  private readonly client: Client
  private keepRunning = true
  private loopPromise: Promise<void> | null = null
  private nextReconcileRunAt = 0
  private syncDisabledLogged = false

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

  async start(options?: { startLoop?: boolean }) {
    await this.client.login(this.config.discordBotToken)
    await this.waitForReady()

    if (this.config.reconcileEnabled) {
      this.nextReconcileRunAt = Date.now()
    }

    this.logger.info(
      {
        workerId: this.config.workerId,
        guildScope: this.config.guildId || null,
        syncEnabled: this.config.syncEnabled,
        syncDryRun: this.config.syncDryRun,
        batchSize: this.config.claimBatchSize,
        reconcileEnabled: this.config.reconcileEnabled,
        reconcileIntervalMs: this.config.reconcileIntervalMs,
        reconcileDryRun: this.config.reconcileDryRun,
      },
      'Discord sync worker started'
    )

    if (options?.startLoop === false) {
      return
    }

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
      if (this.config.reconcileEnabled && Date.now() >= this.nextReconcileRunAt) {
        const scheduledCorrelationId = createCorrelationId('reconcile-scheduled')

        try {
          await this.runReconciliationCycle({
            mode: 'scheduled',
            dryRun: this.config.reconcileDryRun,
            correlationId: scheduledCorrelationId,
          })
        } catch (error) {
          this.logger.error(
            {
              err: error,
              correlationId: scheduledCorrelationId,
            },
            'Scheduled reconcile cycle failed'
          )
        } finally {
          this.nextReconcileRunAt = Date.now() + this.config.reconcileIntervalMs
        }
      }

      if (!this.config.syncEnabled) {
        if (!this.syncDisabledLogged) {
          this.syncDisabledLogged = true
          this.logger.info(
            {
              workerId: this.config.workerId,
            },
            'Sync loop idle because DISCORD_SYNC_ENABLED is false'
          )
        }

        await sleep(this.config.pollIntervalMs)
        continue
      }

      this.syncDisabledLogged = false

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

  async runReconciliationCycle(params: {
    mode: 'scheduled' | 'targeted'
    dryRun: boolean
    correlationId?: string
    targetUserId?: string
  }): Promise<ReconcileRunMetrics> {
    const correlationId = params.correlationId || createCorrelationId(`reconcile-${params.mode}`)
    const effectiveDryRun = params.dryRun || this.config.syncDryRun || !this.config.syncEnabled

    if (!this.config.guildId) {
      const metrics: ReconcileRunMetrics = {
        mode: params.mode,
        dryRun: effectiveDryRun,
        guildId: 'unknown',
        scopedUserId: params.targetUserId || null,
        scannedUsers: 0,
        mismatchesFound: 0,
        correctedCount: 0,
        failedCount: 1,
      }

      this.logger.error(
        {
          correlationId,
          mode: params.mode,
        },
        'Reconcile run skipped because DISCORD_SYNC_GUILD_ID is not configured'
      )

      return metrics
    }

    const scanResult = await this.apiClient.scanReconcileCandidates({
      guildId: this.config.guildId,
      userId: params.targetUserId,
      limit: params.targetUserId ? undefined : this.config.reconcileScanLimit,
      correlationId,
    })

    const metrics: ReconcileRunMetrics = {
      mode: params.mode,
      dryRun: effectiveDryRun,
      guildId: this.config.guildId,
      scopedUserId: params.targetUserId || null,
      scannedUsers: scanResult.scannedUsers,
      mismatchesFound: 0,
      correctedCount: 0,
      failedCount: 0,
    }

    for (const candidate of scanResult.candidates) {
      try {
        const guild = await this.client.guilds.fetch(candidate.guildId)
        const member = await guild.members.fetch(candidate.discordId)
        const actualRoleIds = Array.from(member.roles.cache.keys())

        const drift = evaluateRoleDrift({
          expectedRoleId: candidate.expectedRoleId,
          rankRoleIds: candidate.rankRoleIds,
          actualRoleIds,
        })

        if (!drift.hasDrift) {
          continue
        }

        metrics.mismatchesFound += 1

        if (effectiveDryRun) {
          continue
        }

        const enqueueResult = await this.apiClient.executeReconcile({
          guildId: candidate.guildId,
          userId: candidate.userId,
          dryRun: false,
          mode: 'targeted',
          reason: `${params.mode}_drift_repair`,
          correlationId,
        })

        if (enqueueResult.queuedJobs > 0) {
          metrics.correctedCount += 1
        }
      } catch (error) {
        metrics.failedCount += 1

        this.logger.warn(
          {
            err: error,
            correlationId,
            candidateUserId: candidate.userId,
            candidateDiscordId: candidate.discordId,
            guildId: candidate.guildId,
          },
          'Failed processing reconcile candidate'
        )
      }
    }

    this.logger.info(
      {
        correlationId,
        mode: metrics.mode,
        dryRun: metrics.dryRun,
        guildId: metrics.guildId,
        scopedUserId: metrics.scopedUserId,
        scannedUsers: metrics.scannedUsers,
        mismatchesFound: metrics.mismatchesFound,
        correctedCount: metrics.correctedCount,
        failedCount: metrics.failedCount,
      },
      'Discord reconcile cycle completed'
    )

    return metrics
  }

  private async processJob(job: ClaimedSyncJob) {
    const correlationId = job.correlationId || createCorrelationId(`job-${job.id}`)

    try {
      const member = await this.resolveMember(job)
      const isDryRun = this.config.syncDryRun || !this.config.syncEnabled
      if (!isDryRun) {
        await this.syncMemberRankRoles(member, job, correlationId)
      } else {
        this.logger.info(
          {
            correlationId,
            jobId: job.id,
            guildId: job.guildId,
            discordId: job.discordId,
            targetRoleId: job.targetRoleId,
            targetRank: job.targetRank,
            syncEnabled: this.config.syncEnabled,
            syncDryRun: this.config.syncDryRun,
          },
          'Dry-run mode active, skipping Discord role mutation'
        )
      }

      await this.apiClient.completeJob({
        jobId: job.id,
        correlationId,
        payload: {
          note: isDryRun
            ? `Dry-run: would assign role ${job.targetRoleId} for rank ${job.targetRank}`
            : `Assigned role ${job.targetRoleId} for rank ${job.targetRank}`,
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
