import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
  name: string;
  description: string;
  cost: number;
  stock: number;
  requiredRank?: string;
  exclusiveToTop3?: boolean;
  discountable?: boolean;
  imageUrl?: string;
}

const RewardSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  cost: { type: Number, required: true },
  stock: { type: Number, required: true },
  requiredRank: { type: String, default: 'Rookie' },
  exclusiveToTop3: { type: Boolean, default: false },
  discountable: { type: Boolean, default: true },
  imageUrl: { type: String },
});

export default mongoose.models.Reward || mongoose.model<IReward>('Reward', RewardSchema);