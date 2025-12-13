import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
  name: string;
  description: string;
  cost: number;
  stock: number;
}

const RewardSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  cost: { type: Number, required: true },
  stock: { type: Number, required: true },
});

export default mongoose.models.Reward || mongoose.model<IReward>('Reward', RewardSchema);
