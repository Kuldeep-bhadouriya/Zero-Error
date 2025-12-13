import mongoose, { Schema, Document } from 'mongoose'

export interface ISiteSetting extends Document {
  heroVideoUrl?: string
  heroPosterUrl?: string
  previousHeroVideoUrl?: string
  previousHeroPosterUrl?: string
  updatedAt: Date
  updatedBy?: string
}

const SiteSettingSchema: Schema = new Schema(
  {
    heroVideoUrl: { type: String },
    heroPosterUrl: { type: String },
    previousHeroVideoUrl: { type: String },
    previousHeroPosterUrl: { type: String },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.SiteSetting ||
  mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema)
