import mongoose, { Document, Schema } from 'mongoose'

const DISCORD_ACTIVITY_TYPES = [
  'message_post',
  'helpful_reply',
  'voice_participation',
] as const

const DISCORD_ACTIVITY_STATUSES = [
  'received',
  'applied',
  'skipped_disabled',
  'skipped_user_not_eligible',
  'skipped_cooldown',
  'skipped_cap',
] as const

export type DiscordActivityType = (typeof DISCORD_ACTIVITY_TYPES)[number]
export type DiscordActivityStatus = (typeof DISCORD_ACTIVITY_STATUSES)[number]

export interface IDiscordActivityLedger extends Document {
  sourceEventId: string
  correlationId?: string
  discordId: string
  userId?: mongoose.Types.ObjectId
  guildId?: string
  activityType: DiscordActivityType
  units: number
  pointsRequested: number
  pointsAwarded: number
  status: DiscordActivityStatus
  statusReason?: string
  occurredAt: Date
  processedAt?: Date
  metadata?: Record<string, unknown>
  rankBefore?: string
  rankAfter?: string
  experienceBefore?: number
  experienceAfter?: number
  createdAt: Date
  updatedAt: Date
}

const DiscordActivityLedgerSchema = new Schema<IDiscordActivityLedger>(
  {
    sourceEventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },
    correlationId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    discordId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    guildId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    activityType: {
      type: String,
      enum: DISCORD_ACTIVITY_TYPES,
      required: true,
      index: true,
    },
    units: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    pointsRequested: {
      type: Number,
      required: true,
      min: 0,
    },
    pointsAwarded: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: DISCORD_ACTIVITY_STATUSES,
      required: true,
      default: 'received',
      index: true,
    },
    statusReason: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    rankBefore: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    rankAfter: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    experienceBefore: {
      type: Number,
      min: 0,
    },
    experienceAfter: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

DiscordActivityLedgerSchema.index({ userId: 1, activityType: 1, occurredAt: -1 })
DiscordActivityLedgerSchema.index({ status: 1, occurredAt: -1 })

export const DISCORD_ACTIVITY_LEDGER_TYPES = DISCORD_ACTIVITY_TYPES

export default mongoose.models.DiscordActivityLedger ||
  mongoose.model<IDiscordActivityLedger>('DiscordActivityLedger', DiscordActivityLedgerSchema)
