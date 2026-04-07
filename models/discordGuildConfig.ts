import mongoose, { Schema, Document } from 'mongoose'
import { RANKS, type RankName } from '@/lib/ranks'

const RANK_NAMES = RANKS.map((rank) => rank.name) as RankName[]

export interface IDiscordRankRoleMapping {
  rank: RankName
  roleId: string
  roleName?: string
  enabled: boolean
}

export interface IDiscordGuildConfig extends Document {
  guildId: string
  guildName?: string
  enabled: boolean
  rankRoleMappings: IDiscordRankRoleMapping[]
  lastReconciledAt?: Date
  createdAt: Date
  updatedAt: Date
}

const RankRoleMappingSchema = new Schema<IDiscordRankRoleMapping>(
  {
    rank: {
      type: String,
      enum: RANK_NAMES,
      required: true,
    },
    roleId: {
      type: String,
      required: true,
      trim: true,
    },
    roleName: {
      type: String,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
)

const DiscordGuildConfigSchema = new Schema<IDiscordGuildConfig>(
  {
    guildId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    guildName: {
      type: String,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    rankRoleMappings: {
      type: [RankRoleMappingSchema],
      default: [],
      validate: {
        validator: function (mappings: IDiscordRankRoleMapping[]) {
          const rankSet = new Set(mappings.map((mapping) => mapping.rank))
          const roleSet = new Set(mappings.map((mapping) => mapping.roleId))
          return rankSet.size === mappings.length && roleSet.size === mappings.length
        },
        message:
          'Each rank and role can only appear once per guild mapping configuration',
      },
    },
    lastReconciledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

DiscordGuildConfigSchema.index({ enabled: 1, updatedAt: -1 })
DiscordGuildConfigSchema.index({ 'rankRoleMappings.rank': 1 })

export default mongoose.models.DiscordGuildConfig ||
  mongoose.model<IDiscordGuildConfig>('DiscordGuildConfig', DiscordGuildConfigSchema)
