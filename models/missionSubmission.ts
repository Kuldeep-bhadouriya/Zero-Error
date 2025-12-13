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
})

const MissionSubmission =
  models.MissionSubmission ||
  model('MissionSubmission', MissionSubmissionSchema)

export default MissionSubmission
