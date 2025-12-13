import { Schema, model, models } from 'mongoose'

export interface IMission {
  _id: string
  name: string
  description: string
  points: number
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  requiredProofType: 'image' | 'video' | 'both'
  maxFileSize: number
  instructions: string
  exampleImageUrl?: string
  
  // Time limit fields
  startDate?: Date
  endDate?: Date
  isTimeLimited: boolean
  daysAvailable?: number
  
  // Status fields
  active: boolean
  featured: boolean
  maxCompletions?: number
  currentCompletions: number
  
  // Metadata
  createdBy?: Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  deactivatedAt?: Date
  deactivatedBy?: Schema.Types.ObjectId
}

const MissionSchema = new Schema<IMission>({
  name: {
    type: String,
    required: [true, 'Mission name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Mission description is required'],
    trim: true,
  },
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [0, 'Points must be a positive number'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'General',
    trim: true,
  },
  difficulty: {
    type: String,
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: 'Difficulty must be Easy, Medium, or Hard'
    },
    default: 'Easy',
  },
  requiredProofType: {
    type: String,
    enum: {
      values: ['image', 'video', 'both'],
      message: 'Proof type must be image, video, or both'
    },
    default: 'image',
  },
  maxFileSize: {
    type: Number,
    default: 50, // MB
    min: [1, 'Max file size must be at least 1MB'],
    max: [100, 'Max file size cannot exceed 100MB'],
  },
  instructions: {
    type: String,
    required: [true, 'Instructions are required'],
    trim: true,
  },
  exampleImageUrl: {
    type: String,
  },
  
  // Time limit fields
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  isTimeLimited: {
    type: Boolean,
    default: false,
  },
  daysAvailable: {
    type: Number,
  },
  
  // Status fields
  active: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  maxCompletions: {
    type: Number,
  },
  currentCompletions: {
    type: Number,
    default: 0,
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  deactivatedAt: {
    type: Date,
  },
  deactivatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true, // Auto-creates createdAt and updatedAt
})

const Mission = models.Mission || model<IMission>('Mission', MissionSchema)

export default Mission
