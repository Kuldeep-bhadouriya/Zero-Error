import mongoose, { Schema, Document } from 'mongoose'
import { RANKS, type RankName } from '@/lib/ranks'

const RANK_NAMES = RANKS.map((rank) => rank.name) as RankName[]

const DISCORD_SYNC_JOB_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'dead_letter',
] as const

const DISCORD_SYNC_JOB_SOURCES = ['rank_change', 'reconcile', 'manual_retry'] as const

export type DiscordSyncJobStatus = (typeof DISCORD_SYNC_JOB_STATUSES)[number]
export type DiscordSyncJobSource = (typeof DISCORD_SYNC_JOB_SOURCES)[number]

export interface IDiscordSyncJob extends Document {
  userId: mongoose.Schema.Types.ObjectId
  guildId: string
  discordId: string
  targetRank: RankName
  targetRoleId: string
  status: DiscordSyncJobStatus
  source: DiscordSyncJobSource
  idempotencyKey: string
  attemptCount: number
  maxAttempts: number
  nextRetryAt?: Date
  claimedAt?: Date
  claimedBy?: string
  completedAt?: Date
  failedAt?: Date
  lastError?: string
  lastErrorCode?: string
  correlationId?: string
  createdAt: Date
  updatedAt: Date
}

const DiscordSyncJobSchema = new Schema<IDiscordSyncJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    guildId: {
      type: String,
      required: true,
      trim: true,
    },
    discordId: {
      type: String,
      required: true,
      trim: true,
    },
    targetRank: {
      type: String,
      enum: RANK_NAMES,
      required: true,
    },
    targetRoleId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: DISCORD_SYNC_JOB_STATUSES,
      default: 'pending',
      index: true,
    },
    source: {
      type: String,
      enum: DISCORD_SYNC_JOB_SOURCES,
      default: 'rank_change',
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },
    nextRetryAt: {
      type: Date,
    },
    claimedAt: {
      type: Date,
    },
    claimedBy: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    lastError: {
      type: String,
    },
    lastErrorCode: {
      type: String,
      trim: true,
    },
    correlationId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

DiscordSyncJobSchema.index({ status: 1, nextRetryAt: 1, createdAt: 1 })
DiscordSyncJobSchema.index({ userId: 1, guildId: 1, createdAt: -1 })
DiscordSyncJobSchema.index({ guildId: 1, status: 1, updatedAt: -1 })
DiscordSyncJobSchema.index(
  { userId: 1, guildId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'processing'] },
    },
  }
)

export default mongoose.models.DiscordSyncJob ||
  mongoose.model<IDiscordSyncJob>('DiscordSyncJob', DiscordSyncJobSchema)
