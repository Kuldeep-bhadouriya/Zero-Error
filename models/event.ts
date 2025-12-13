import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IEvent extends Document {
  title: string
  description: string
  eventDate: Date
  eventType: 'upcoming' | 'past' | 'current'
  imageUrl?: string
  location?: string
  registrationLink?: string
  featured: boolean
  games: string[]
  organizer: string
  maxParticipants?: number
  currentParticipants: number
  status: 'draft' | 'published' | 'cancelled'
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: ['upcoming', 'past', 'current'],
      required: [true, 'Event type is required'],
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    registrationLink: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    games: {
      type: [String],
      default: [],
    },
    organizer: {
      type: String,
      default: 'Zero Error Esports',
      trim: true,
    },
    maxParticipants: {
      type: Number,
      min: [0, 'Max participants cannot be negative'],
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: [0, 'Current participants cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled'],
      default: 'draft',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient querying
EventSchema.index({ eventType: 1, status: 1, eventDate: 1 })
EventSchema.index({ featured: 1, status: 1, eventDate: 1 })

// Delete the cached model if it exists to ensure schema updates are applied
if (mongoose.models.Event) {
  delete mongoose.models.Event
}

const Event: Model<IEvent> = mongoose.model<IEvent>('Event', EventSchema)

export default Event
