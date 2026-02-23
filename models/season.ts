import mongoose, { Schema, Document } from 'mongoose'

export interface ISeason extends Document {
  seasonNumber: number
  name: string
  description?: string
  status: 'upcoming' | 'active' | 'completed'
  startDate: Date
  scheduledEndDate: Date
  actualEndDate?: Date
  endedBy?: mongoose.Schema.Types.ObjectId
  endReason?: 'scheduled' | 'manual_early' | 'manual_extended'
  totalParticipants?: number
  createdBy: mongoose.Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SeasonSchema: Schema = new Schema(
  {
    seasonNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Season name is required'],
      trim: true,
    },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
    startDate: { type: Date, required: true },
    scheduledEndDate: { type: Date, required: true },
    actualEndDate: { type: Date },
    endedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    endReason: {
      type: String,
      enum: ['scheduled', 'manual_early', 'manual_extended'],
    },
    totalParticipants: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

// Ensure at most one season is 'active' at any time
SeasonSchema.index(
  { status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
  }
)

export default mongoose.models.Season ||
  mongoose.model<ISeason>('Season', SeasonSchema)
