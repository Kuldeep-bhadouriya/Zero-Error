import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IAnnouncement extends Document {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'urgent'
  priority: number
  active: boolean
  startDate?: Date
  endDate?: Date
  link?: string
  linkText?: string
  targetPages: string[]
  dismissible: boolean
  createdBy?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'success', 'urgent'],
      default: 'info',
    },
    priority: { type: Number, required: true, min: 1, max: 10, default: 5 },
    active: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    link: { type: String, trim: true },
    linkText: { type: String, trim: true },
    targetPages: { type: [String], default: ['all'] },
    dismissible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

AnnouncementSchema.index({ active: 1, priority: -1 })
AnnouncementSchema.index({ startDate: 1, endDate: 1 })

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema)
