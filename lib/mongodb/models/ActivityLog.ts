import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ip_address: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ActivityLogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
