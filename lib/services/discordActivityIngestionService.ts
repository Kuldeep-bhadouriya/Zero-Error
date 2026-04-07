import logger from '@/lib/logger'
import { applyRankFromExperience } from '@/lib/services/rankService'
import { enqueueDiscordSyncJobsForRankChange } from '@/lib/services/discordSyncEnqueueService'
import { getDiscordActivityRule } from '@/lib/discord-activity-rules'
import { getDiscordActivityFlags } from '@/lib/discord-sync-flags'
import DiscordActivityLedger, {
  type DiscordActivityStatus,
  type DiscordActivityType,
} from '@/models/discordActivityLedger'
import User from '@/models/user'

type IngestDiscordActivityInput = {
  sourceEventId: string
  discordId: string
  guildId?: string
  activityType: DiscordActivityType
  units: number
  occurredAt: Date
  metadata?: Record<string, unknown>
  correlationId: string
}

export type IngestDiscordActivityResult = {
  sourceEventId: string
  status: DiscordActivityStatus | 'duplicate'
  pointsRequested: number
  pointsAwarded: number
  duplicate: boolean
  userId: string | null
  rankChanged: boolean
  rankBefore: string | null
  rankAfter: string | null
  reason: string | null
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(
    typeof error === 'object' &&
      error &&
      'code' in error &&
      ((error as { code?: unknown }).code === 11000 || (error as { code?: unknown }).code === 11001)
  )
}

function getUtcDayBounds(date: Date) {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
  const dayEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
  return { dayStart, dayEnd }
}

async function markLedgerSkipped(params: {
  ledgerId: string
  status: Extract<
    DiscordActivityStatus,
    'skipped_disabled' | 'skipped_user_not_eligible' | 'skipped_cooldown' | 'skipped_cap'
  >
  reason: string
  pointsAwarded?: number
  userId?: string
}) {
  await DiscordActivityLedger.findByIdAndUpdate(params.ledgerId, {
    $set: {
      status: params.status,
      statusReason: params.reason,
      pointsAwarded: params.pointsAwarded || 0,
      processedAt: new Date(),
      ...(params.userId ? { userId: params.userId } : {}),
    },
  })
}

export async function ingestDiscordActivityEvent(
  input: IngestDiscordActivityInput
): Promise<IngestDiscordActivityResult> {
  const rule = getDiscordActivityRule(input.activityType)
  const flags = getDiscordActivityFlags()
  const pointsRequested = rule.pointsPerUnit * input.units

  let ledger
  try {
    ledger = await DiscordActivityLedger.create({
      sourceEventId: input.sourceEventId,
      correlationId: input.correlationId,
      discordId: input.discordId,
      guildId: input.guildId,
      activityType: input.activityType,
      units: input.units,
      pointsRequested,
      pointsAwarded: 0,
      status: 'received',
      occurredAt: input.occurredAt,
      metadata: input.metadata,
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existingRaw = await DiscordActivityLedger.findOne({
        sourceEventId: input.sourceEventId,
      }).lean()
      const existing = existingRaw as {
        pointsRequested?: number
        pointsAwarded?: number
        userId?: { toString(): string }
        rankBefore?: string
        rankAfter?: string
        statusReason?: string
      } | null

      return {
        sourceEventId: input.sourceEventId,
        status: 'duplicate',
        pointsRequested: existing?.pointsRequested || pointsRequested,
        pointsAwarded: existing?.pointsAwarded || 0,
        duplicate: true,
        userId: existing?.userId ? existing.userId.toString() : null,
        rankChanged: Boolean(existing?.rankBefore && existing?.rankAfter && existing.rankBefore !== existing.rankAfter),
        rankBefore: existing?.rankBefore || null,
        rankAfter: existing?.rankAfter || null,
        reason: existing?.statusReason || 'duplicate_source_event',
      }
    }

    throw error
  }

  if (!flags.activityPointsEnabled) {
    await markLedgerSkipped({
      ledgerId: ledger._id.toString(),
      status: 'skipped_disabled',
      reason: 'activity_points_disabled_by_flag',
    })

    return {
      sourceEventId: input.sourceEventId,
      status: 'skipped_disabled',
      pointsRequested,
      pointsAwarded: 0,
      duplicate: false,
      userId: null,
      rankChanged: false,
      rankBefore: null,
      rankAfter: null,
      reason: 'activity_points_disabled_by_flag',
    }
  }

  const user = await User.findOne({
    discordId: input.discordId,
    'discordSync.linkStatus': 'linked_verified',
    'discordSync.verified': true,
  })

  if (!user) {
    await markLedgerSkipped({
      ledgerId: ledger._id.toString(),
      status: 'skipped_user_not_eligible',
      reason: 'no_verified_linked_user',
    })

    return {
      sourceEventId: input.sourceEventId,
      status: 'skipped_user_not_eligible',
      pointsRequested,
      pointsAwarded: 0,
      duplicate: false,
      userId: null,
      rankChanged: false,
      rankBefore: null,
      rankAfter: null,
      reason: 'no_verified_linked_user',
    }
  }

  const cooldownStart = new Date(input.occurredAt.getTime() - rule.cooldownSeconds * 1000)
  const lastAppliedWithinCooldown = await DiscordActivityLedger.findOne({
    userId: user._id,
    activityType: input.activityType,
    status: 'applied',
    occurredAt: { $gte: cooldownStart },
  })
    .sort({ occurredAt: -1 })
    .lean()

  if (lastAppliedWithinCooldown) {
    await markLedgerSkipped({
      ledgerId: ledger._id.toString(),
      status: 'skipped_cooldown',
      reason: 'cooldown_active',
      userId: user._id.toString(),
    })

    return {
      sourceEventId: input.sourceEventId,
      status: 'skipped_cooldown',
      pointsRequested,
      pointsAwarded: 0,
      duplicate: false,
      userId: user._id.toString(),
      rankChanged: false,
      rankBefore: user.rank,
      rankAfter: user.rank,
      reason: 'cooldown_active',
    }
  }

  const { dayStart, dayEnd } = getUtcDayBounds(input.occurredAt)

  const [capUsage] = await DiscordActivityLedger.aggregate([
    {
      $match: {
        userId: user._id,
        activityType: input.activityType,
        status: 'applied',
        occurredAt: { $gte: dayStart, $lte: dayEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalAwarded: { $sum: '$pointsAwarded' },
      },
    },
  ])

  const awardedToday = capUsage?.totalAwarded || 0
  const remainingCap = Math.max(0, rule.dailyCapPoints - awardedToday)
  const pointsAwarded = Math.min(pointsRequested, remainingCap)

  if (pointsAwarded <= 0) {
    await markLedgerSkipped({
      ledgerId: ledger._id.toString(),
      status: 'skipped_cap',
      reason: 'daily_cap_reached',
      userId: user._id.toString(),
    })

    return {
      sourceEventId: input.sourceEventId,
      status: 'skipped_cap',
      pointsRequested,
      pointsAwarded: 0,
      duplicate: false,
      userId: user._id.toString(),
      rankChanged: false,
      rankBefore: user.rank,
      rankAfter: user.rank,
      reason: 'daily_cap_reached',
    }
  }

  const previousRank = user.rank
  const experienceBefore = user.experience

  user.experience += pointsAwarded
  user.points = user.experience
  applyRankFromExperience(user)
  await user.save()

  await DiscordActivityLedger.findByIdAndUpdate(ledger._id, {
    $set: {
      userId: user._id,
      status: 'applied',
      pointsAwarded,
      processedAt: new Date(),
      rankBefore: previousRank,
      rankAfter: user.rank,
      experienceBefore,
      experienceAfter: user.experience,
    },
  })

  const rankChanged = previousRank !== user.rank

  if (rankChanged) {
    try {
      await enqueueDiscordSyncJobsForRankChange({
        user,
        previousRank,
        sourceEventId: `discord-activity:${input.sourceEventId}`,
        correlationId: input.correlationId,
      })
    } catch (error) {
      logger.error(
        {
          sourceEventId: input.sourceEventId,
          userId: user._id.toString(),
          discordId: input.discordId,
          err: error,
        },
        'Failed to enqueue Discord rank sync after activity points application'
      )
    }
  }

  logger.info(
    {
      sourceEventId: input.sourceEventId,
      correlationId: input.correlationId,
      userId: user._id.toString(),
      discordId: input.discordId,
      activityType: input.activityType,
      units: input.units,
      pointsRequested,
      pointsAwarded,
      rankBefore: previousRank,
      rankAfter: user.rank,
      rankChanged,
    },
    'Discord activity points processed'
  )

  return {
    sourceEventId: input.sourceEventId,
    status: 'applied',
    pointsRequested,
    pointsAwarded,
    duplicate: false,
    userId: user._id.toString(),
    rankChanged,
    rankBefore: previousRank,
    rankAfter: user.rank,
    reason: null,
  }
}
