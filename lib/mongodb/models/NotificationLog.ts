import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationLog extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  type: 'payment' | 'attendance' | 'assessment' | 'enrollment' | 'announcement';
  subject: string;
  message: string;
  channels: string[];
  status: 'sent' | 'failed' | 'pending';
  created_at: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['payment', 'attendance', 'assessment', 'enrollment', 'announcement'], required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    channels: [{ type: String }],
    status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationLogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
export default NotificationLog;
