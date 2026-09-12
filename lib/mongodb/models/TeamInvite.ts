import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeamInvite extends Document {
  _id: mongoose.Types.ObjectId;
  workspace_id: mongoose.Types.ObjectId;
  email: string;
  role: 'teacher' | 'admin';
  token_hash: string;
  invited_by: mongoose.Types.ObjectId;
  class_ids: mongoose.Types.ObjectId[];
  expires_at: Date;
  accepted_at?: Date;
  revoked_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const TeamInviteSchema = new Schema<ITeamInvite>(
  {
    workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' },
    token_hash: { type: String, required: true, unique: true },
    invited_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    class_ids: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    expires_at: { type: Date, required: true, index: true },
    accepted_at: { type: Date },
    revoked_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TeamInviteSchema.index({ workspace_id: 1, email: 1, accepted_at: 1, revoked_at: 1 });

const TeamInvite: Model<ITeamInvite> = mongoose.models.TeamInvite || mongoose.model<ITeamInvite>('TeamInvite', TeamInviteSchema);
export default TeamInvite;
