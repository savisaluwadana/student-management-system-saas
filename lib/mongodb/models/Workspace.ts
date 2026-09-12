import mongoose, { Schema, Document, Model } from 'mongoose';

export type WorkspacePlan = 'starter' | 'professional' | 'scale';
export type WorkspaceSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  owner_user_id: mongoose.Types.ObjectId;
  plan: WorkspacePlan;
  subscription_status: WorkspaceSubscriptionStatus;
  trial_ends_at?: Date;
  current_period_end?: Date;
  billing_email?: string;
  currency: string;
  timezone: string;
  status: 'active' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    owner_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['starter', 'professional', 'scale'], default: 'professional' },
    subscription_status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled'],
      default: 'trialing',
    },
    trial_ends_at: { type: Date },
    current_period_end: { type: Date },
    billing_email: { type: String, lowercase: true, trim: true },
    currency: { type: String, default: 'LKR' },
    timezone: { type: String, default: 'Asia/Colombo' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

WorkspaceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);

export default Workspace;
