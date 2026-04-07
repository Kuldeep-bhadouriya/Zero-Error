import crypto from 'crypto'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'
import User from '@/models/user'

export type ExecuteDiscordReconcileInput = {
  guildId: string
  userId?: string
  dryRun: boolean
  correlationId: string
  mode?: 'scheduled' | 'targeted' | 'manual'
}

export type ExecuteDiscordReconcileResult = {
  mode: 'scheduled' | 'targeted' | 'manual'
  dryRun: boolean
  guildId: string
  scopedUserId: string | null
  eligibleCount: number
  mappedUsers: number
  queuedJobs: number
  skippedActiveJob: number
  skippedMissingMapping: number
}

export type ReconcileCandidate = {
  userId: string
  discordId: string
  guildId: string
  expectedRank: string
  expectedRoleId: string
  rankRoleIds: string[]
}

export type ListDiscordReconcileCandidatesInput = {
  guildId: string
  userId?: string
  limit?: number
}

export type ListDiscordReconcileCandidatesResult = {
  guildId: string
  scopedUserId: string | null
  scannedUsers: number
  candidates: ReconcileCandidate[]
  skippedMissingMapping: number
}

function buildRoleMap(guildConfig: {
  rankRoleMappings: Array<{ enabled: boolean; rank: string; roleId: string }>
}) {
  const roleByRank = new Map(
    guildConfig.rankRoleMappings
      .filter((mapping) => mapping.enabled)
      .map((mapping) => [mapping.rank, mapping.roleId])
  )

  const rankRoleIds = Array.from(
    new Set(
      guildConfig.rankRoleMappings
        .filter((mapping) => mapping.enabled)
        .map((mapping) => mapping.roleId)
    )
  )

  return { roleByRank, rankRoleIds }
}

async function findGuildConfigOrThrow(guildId: string): Promise<{
  rankRoleMappings: Array<{ enabled: boolean; rank: string; roleId: string }>
}> {
  const guildConfigRaw = await DiscordGuildConfig.findOne({ guildId, enabled: true }).lean()
  const guildConfig = guildConfigRaw as unknown as {
    rankRoleMappings: Array<{ enabled: boolean; rank: string; roleId: string }>
  } | null

  if (!guildConfig) {
    const error = new Error('Active guild config not found for the provided guildId')
    ;(error as Error & { code?: string }).code = 'GUILD_CONFIG_NOT_FOUND'
    throw error
  }

  return guildConfig
}

export async function listDiscordReconcileCandidates(
  input: ListDiscordReconcileCandidatesInput
): Promise<ListDiscordReconcileCandidatesResult> {
  const guildConfig = await findGuildConfigOrThrow(input.guildId)
  const { roleByRank, rankRoleIds } = buildRoleMap(guildConfig)

  const userFilter: Record<string, unknown> = {
    discordId: { $exists: true, $ne: null },
    'discordSync.linkStatus': 'linked_verified',
    'discordSync.verified': true,
  }

  if (input.userId) {
    userFilter._id = input.userId
  }

  const query = User.find(userFilter).select('_id discordId rank').sort({ _id: 1 })
  if (input.limit && input.limit > 0) {
    query.limit(Math.min(input.limit, 500))
  }

  const eligibleUsersRaw = await query.lean()
  const eligibleUsers = eligibleUsersRaw as unknown as Array<{
    _id: { toString(): string }
    discordId: string
    rank: string
  }>

  let skippedMissingMapping = 0
  const candidates: ReconcileCandidate[] = []

  for (const user of eligibleUsers) {
    const expectedRoleId = roleByRank.get(user.rank)
    if (!expectedRoleId) {
      skippedMissingMapping += 1
      continue
    }

    candidates.push({
      userId: user._id.toString(),
      discordId: user.discordId,
      guildId: input.guildId,
      expectedRank: user.rank,
      expectedRoleId,
      rankRoleIds,
    })
  }

  return {
    guildId: input.guildId,
    scopedUserId: input.userId || null,
    scannedUsers: eligibleUsers.length,
    candidates,
    skippedMissingMapping,
  }
}

export async function executeDiscordReconcile(
  input: ExecuteDiscordReconcileInput
): Promise<ExecuteDiscordReconcileResult> {
  const candidatesResult = await listDiscordReconcileCandidates({
    guildId: input.guildId,
    userId: input.userId,
  })

  let mappedUsers = candidatesResult.candidates.length
  let queuedJobs = 0
  let skippedActiveJob = 0
  const skippedMissingMapping = candidatesResult.skippedMissingMapping

  if (!input.dryRun) {
    for (const candidate of candidatesResult.candidates) {

      const activeJob = await DiscordSyncJob.exists({
        userId: candidate.userId,
        guildId: input.guildId,
        status: { $in: ['pending', 'processing'] },
      })

      if (activeJob) {
        skippedActiveJob += 1
        continue
      }

      await DiscordSyncJob.create({
        userId: candidate.userId,
        guildId: input.guildId,
        discordId: candidate.discordId,
        targetRank: candidate.expectedRank,
        targetRoleId: candidate.expectedRoleId,
        status: 'pending',
        source: 'reconcile',
        idempotencyKey: `reconcile:${input.correlationId}:${candidate.userId}:${crypto.randomUUID()}`,
        correlationId: input.correlationId,
      })

      queuedJobs += 1
    }
  }

  return {
    mode: input.mode || (input.userId ? 'targeted' : 'manual'),
    dryRun: input.dryRun,
    guildId: input.guildId,
    scopedUserId: input.userId || null,
    eligibleCount: candidatesResult.scannedUsers,
    mappedUsers,
    queuedJobs,
    skippedActiveJob,
    skippedMissingMapping,
  }
}
