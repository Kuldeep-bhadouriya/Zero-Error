import mongoose, { Schema, Document } from 'mongoose'

export interface ISeasonArchive extends Document {
  season: mongoose.Schema.Types.ObjectId
  seasonNumber: number
  user: mongoose.Schema.Types.ObjectId
  finalExperience: number
  finalZeCoins: number
  finalRank: string
  finalRankIcon: string
  leaderboardPosition: number
  zeTag: string
  profilePhotoUrl?: string
  totalMissionsCompleted: number
  totalRedemptions: number
  isSeasonWinner: boolean
  isTopThree: boolean
  archivedAt: Date
}

const SeasonArchiveSchema: Schema = new Schema(
  {
    season: {
      type: Schema.Types.ObjectId,
      ref: 'Season',
      required: true,
    },
    seasonNumber: { type: Number, required: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    finalExperience: { type: Number, required: true },
    finalZeCoins: { type: Number, required: true },
    finalRank: { type: String, required: true },
    finalRankIcon: { type: String, required: true },
    leaderboardPosition: { type: Number, required: true },
    zeTag: { type: String, required: true },
    profilePhotoUrl: { type: String },
    totalMissionsCompleted: { type: Number, default: 0 },
    totalRedemptions: { type: Number, default: 0 },
    isSeasonWinner: { type: Boolean, default: false },
    isTopThree: { type: Boolean, default: false },
    archivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// One archive entry per user per season
SeasonArchiveSchema.index({ season: 1, user: 1 }, { unique: true })
// Fast lookup: all users for a season, sorted by position
SeasonArchiveSchema.index({ seasonNumber: 1, leaderboardPosition: 1 })
// Fast lookup: all seasons for a user
SeasonArchiveSchema.index({ user: 1, seasonNumber: -1 })

export default mongoose.models.SeasonArchive ||
  mongoose.model<ISeasonArchive>('SeasonArchive', SeasonArchiveSchema)
