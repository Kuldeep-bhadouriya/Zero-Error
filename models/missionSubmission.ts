import { Schema, model, models } from 'mongoose'

const MissionSubmissionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mission: {
    type: Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
  },
  proof: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  remarks: {
    type: String,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  revertedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  revertedAt: {
    type: Date,
  },
  revertReason: {
    type: String,
  },
  // Weekly mission tracking
  weekYear: {
    type: String, // Format: "2024-W05"
  },
  weekStartDate: {
    type: Date, // Monday of that week
  },
})

// Create compound index to ensure one approved/pending submission per user per mission
MissionSubmissionSchema.index(
  { user: 1, mission: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'approved'] },
      weekYear: { $exists: false } // For non-weekly missions
    }
  }
)

// Create compound index for weekly missions: one approved/pending submission per user per mission per week
MissionSubmissionSchema.index(
  { user: 1, mission: 1, weekYear: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'approved'] },
      weekYear: { $exists: true } // For weekly missions
    }
  }
)

const MissionSubmission =
  models.MissionSubmission ||
  model('MissionSubmission', MissionSubmissionSchema)

export default MissionSubmission
