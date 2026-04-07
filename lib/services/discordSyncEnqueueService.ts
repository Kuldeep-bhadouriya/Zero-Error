import crypto from 'crypto'
import logger from '@/lib/logger'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'

type DiscordSyncShape = {
  guildId?: string
  linkStatus?: string
  verified?: boolean
}

type EnqueueUser = {
  _id: { toString(): string }
  rank: string
  discordId?: string
  discordSync?: DiscordSyncShape
}

type EnqueueRankChangeInput = {
  user: EnqueueUser
  previousRank?: string | null
  sourceEventId: string
  correlationId?: string
}

export type EnqueueRankChangeResult = {
  enqueuedCount: number
  updatedActiveCount: number
  skippedReasons: string[]
}

function buildIdempotencyKey(params: {
  sourceEventId: string
  userId: string
  guildId: string
  targetRank: string
  targetRoleId: string
}) {
  const hash = crypto
    .createHash('sha256')
    .update(
      [
        'rank_change',
        params.sourceEventId,
        params.userId,
        params.guildId,
        params.targetRank,
        params.targetRoleId,
      ].join(':')
    )
    .digest('hex')

  return `rank-change:${hash}`
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(
    typeof error === 'object' &&
      error &&
      'code' in error &&
      ((error as { code?: unknown }).code === 11000 || (error as { code?: unknown }).code === 11001)
  )
}

function isEligibleForRankSync(user: EnqueueUser) {
  return Boolean(
    user.discordId &&
      user.discordSync?.verified &&
      user.discordSync?.linkStatus === 'linked_verified'
  )
}

export async function enqueueDiscordSyncJobsForRankChange(
  input: EnqueueRankChangeInput
): Promise<EnqueueRankChangeResult> {
  const userId = input.user._id.toString()
  const correlationId = input.correlationId || `rank-change:${input.sourceEventId}`
  const skippedReasons: string[] = []

  if (!input.previousRank || input.previousRank === input.user.rank) {
    const reason = 'rank_unchanged'
    skippedReasons.push(reason)
    logger.info(
      {
        userId,
        previousRank: input.previousRank || null,
        currentRank: input.user.rank,
        sourceEventId: input.sourceEventId,
        correlationId,
        reason,
      },
      'Skipped Discord sync enqueue'
    )
    return { enqueuedCount: 0, updatedActiveCount: 0, skippedReasons }
  }

  if (!isEligibleForRankSync(input.user)) {
    const reason = 'user_not_verified_or_not_linked'
    skippedReasons.push(reason)
    logger.info(
      {
        userId,
        previousRank: input.previousRank,
        currentRank: input.user.rank,
        sourceEventId: input.sourceEventId,
        correlationId,
        reason,
      },
      'Skipped Discord sync enqueue'
    )
    return { enqueuedCount: 0, updatedActiveCount: 0, skippedReasons }
  }

  const guildFilter = input.user.discordSync?.guildId
    ? { enabled: true, guildId: input.user.discordSync.guildId }
    : { enabled: true }

  const guildConfigs = await DiscordGuildConfig.find(guildFilter).lean()

  if (guildConfigs.length === 0) {
    const reason = 'no_enabled_guild_config'
    skippedReasons.push(reason)
    logger.info(
      {
        userId,
        sourceEventId: input.sourceEventId,
        correlationId,
        reason,
        scopedGuildId: input.user.discordSync?.guildId || null,
      },
      'Skipped Discord sync enqueue'
    )
    return { enqueuedCount: 0, updatedActiveCount: 0, skippedReasons }
  }

  let enqueuedCount = 0
  let updatedActiveCount = 0

  for (const guildConfig of guildConfigs) {
    const mapping = guildConfig.rankRoleMappings.find(
      (entry) => entry.enabled && entry.rank === input.user.rank
    )

    if (!mapping) {
      const reason = `no_role_mapping:${guildConfig.guildId}:${input.user.rank}`
      skippedReasons.push(reason)
      logger.info(
        {
          userId,
          guildId: guildConfig.guildId,
          rank: input.user.rank,
          sourceEventId: input.sourceEventId,
          correlationId,
          reason,
        },
        'Skipped Discord sync enqueue'
      )
      continue
    }

    const activeJob = await DiscordSyncJob.findOne({
      userId: input.user._id,
      guildId: guildConfig.guildId,
      status: { $in: ['pending', 'processing'] },
    })

    if (activeJob) {
      if (activeJob.targetRank === input.user.rank && activeJob.targetRoleId === mapping.roleId) {
        const reason = `active_job_already_targets_rank:${guildConfig.guildId}`
        skippedReasons.push(reason)
        logger.info(
          {
            userId,
            guildId: guildConfig.guildId,
            sourceEventId: input.sourceEventId,
            correlationId,
            reason,
            activeJobId: activeJob._id.toString(),
          },
          'Skipped Discord sync enqueue'
        )
        continue
      }

      activeJob.targetRank = input.user.rank as any
      activeJob.targetRoleId = mapping.roleId
      activeJob.discordId = input.user.discordId as string
      activeJob.source = 'rank_change'
      activeJob.correlationId = correlationId
      await activeJob.save()

      updatedActiveCount += 1
      logger.info(
        {
          userId,
          guildId: guildConfig.guildId,
          sourceEventId: input.sourceEventId,
          correlationId,
          activeJobId: activeJob._id.toString(),
          targetRank: input.user.rank,
          targetRoleId: mapping.roleId,
        },
        'Updated active Discord sync job target for rank change'
      )
      continue
    }

    const idempotencyKey = buildIdempotencyKey({
      sourceEventId: input.sourceEventId,
      userId,
      guildId: guildConfig.guildId,
      targetRank: input.user.rank,
      targetRoleId: mapping.roleId,
    })

    try {
      const job = await DiscordSyncJob.create({
        userId: input.user._id,
        guildId: guildConfig.guildId,
        discordId: input.user.discordId,
        targetRank: input.user.rank,
        targetRoleId: mapping.roleId,
        status: 'pending',
        source: 'rank_change',
        idempotencyKey,
        correlationId,
      })

      enqueuedCount += 1
      logger.info(
        {
          userId,
          guildId: guildConfig.guildId,
          sourceEventId: input.sourceEventId,
          correlationId,
          jobId: job._id.toString(),
          idempotencyKey,
          targetRank: input.user.rank,
          targetRoleId: mapping.roleId,
        },
        'Enqueued Discord sync job for rank change'
      )
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const reason = `duplicate_idempotency:${guildConfig.guildId}`
        skippedReasons.push(reason)
        logger.info(
          {
            userId,
            guildId: guildConfig.guildId,
            sourceEventId: input.sourceEventId,
            correlationId,
            idempotencyKey,
            reason,
          },
          'Skipped Discord sync enqueue'
        )
        continue
      }

      throw error
    }
  }

  return {
    enqueuedCount,
    updatedActiveCount,
    skippedReasons,
  }
}
