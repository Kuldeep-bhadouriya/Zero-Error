import mongoose, { Schema, Document } from 'mongoose';

export interface IRedemptionRequest extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  userName: string;
  userEmail: string;
  rewardId: mongoose.Schema.Types.ObjectId;
  rewardName: string;
  rewardCost: number;
  // Contact details for fulfillment
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  additionalNotes?: string;
  // Status tracking
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedBy?: mongoose.Schema.Types.ObjectId;
}

const RedemptionRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    rewardId: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
    rewardName: { type: String, required: true },
    rewardCost: { type: Number, required: true },
    // Contact details
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    address: { type: String, required: true },
    additionalNotes: { type: String },
    // Status
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    adminNotes: { type: String },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
RedemptionRequestSchema.index({ userId: 1, createdAt: -1 });
RedemptionRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.RedemptionRequest || 
  mongoose.model<IRedemptionRequest>('RedemptionRequest', RedemptionRequestSchema);
