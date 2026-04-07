import mongoose, { Schema, Document } from 'mongoose'

const DISCORD_LINK_STATUSES = ['unlinked', 'linked_unverified', 'linked_verified'] as const
const DISCORD_SYNC_STATUSES = ['idle', 'queued', 'processing', 'succeeded', 'failed'] as const

export type DiscordLinkStatus = (typeof DISCORD_LINK_STATUSES)[number]
export type DiscordSyncStatus = (typeof DISCORD_SYNC_STATUSES)[number]

export interface IDiscordSyncMetadata {
  guildId?: string
  linkStatus: DiscordLinkStatus
  verified: boolean
  linkedAt?: Date
  verifiedAt?: Date
  lastSyncedAt?: Date
  lastSyncStatus: DiscordSyncStatus
  lastSyncError?: string
  lastSyncErrorAt?: Date
}

export interface IUser extends Document {
  name?: string
  email?: string
  image?: string
  emailVerified?: Date
  discordId?: string
  discordUsername?: string
  discordGlobalName?: string
  discordAvatar?: string
  // Migration/backfill note:
  // Existing users can keep only `discordId`; `discordSync` is optional and defaults
  // safely for new writes without requiring a breaking data migration.
  discordSync?: IDiscordSyncMetadata
  zeClubId: string
  points: number // DEPRECATED: Use zeCoins and experience instead
  zeCoins: number // For redemption/purchasing rewards
  experience: number // For ranking (never decreases)
  rank: string
  badge: string
  progress: number
  roles: string[]
  // Phase 1: Valorant-style rank system
  rankIcon: string
  progressToNextRank: number
  nextRankPoints: number
  currentRankPoints: number
  zeTag?: string
  bio?: string
  profilePhotoUrl?: string
  hashedPassword?: string
  passwordUpdatedAt?: Date
  accountCreatedAt?: Date
  lastLoginAt?: Date
}

const UserSchema: Schema = new Schema({
  name: { type: String },
  email: { type: String, unique: true },
  image: { type: String },
  emailVerified: { type: Date },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  discordGlobalName: { type: String },
  discordAvatar: { type: String },
  discordSync: {
    guildId: { type: String },
    linkStatus: {
      type: String,
      enum: DISCORD_LINK_STATUSES,
      default: 'unlinked',
    },
    verified: { type: Boolean, default: false },
    linkedAt: { type: Date },
    verifiedAt: { type: Date },
    lastSyncedAt: { type: Date },
    lastSyncStatus: {
      type: String,
      enum: DISCORD_SYNC_STATUSES,
      default: 'idle',
    },
    lastSyncError: { type: String },
    lastSyncErrorAt: { type: Date },
  },
  zeClubId: { type: String, unique: true, sparse: true },
  points: { type: Number, default: 0 }, // DEPRECATED: Kept for backward compatibility
  zeCoins: { type: Number, default: 0 }, // For redemption/purchasing
  experience: { type: Number, default: 0 }, // For ranking (never decreases)
  rank: { type: String, default: 'Rookie' },
  badge: { type: String, default: '🥉' },
  progress: { type: Number, default: 0 },
  roles: { type: [String], default: ['user'] },
  // Phase 1: Valorant-style rank system
  rankIcon: { type: String, default: '/images/ranks/rookie.png' },
  progressToNextRank: { type: Number, default: 0 },
  nextRankPoints: { type: Number, default: 100 },
  currentRankPoints: { type: Number, default: 0 },
  // Phase 4: Profile system
  zeTag: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (v: string) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(v)
      },
      message: 'ZE Tag must be 3-20 characters (alphanumeric and underscore only)',
    },
  },
  bio: { type: String, maxlength: 200 },
  profilePhotoUrl: { type: String },
  hashedPassword: { type: String },
  passwordUpdatedAt: { type: Date },
  accountCreatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
})

UserSchema.index({ email: 1, experience: -1 })
UserSchema.index({ experience: -1 })
UserSchema.index({ 'discordSync.guildId': 1, 'discordSync.linkStatus': 1 })
UserSchema.index({ discordId: 1, 'discordSync.guildId': 1 }, { sparse: true })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
