import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name?: string
  email?: string
  image?: string
  emailVerified?: Date
  discordId: string
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

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
