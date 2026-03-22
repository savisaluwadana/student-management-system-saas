import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationPreference extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  email_notifications: boolean;
  sms_notifications: boolean;
  whatsapp_notifications: boolean;
  notify_payments: boolean;
  notify_attendance: boolean;
  notify_assessments: boolean;
  notify_enrollments: boolean;
  notify_announcements: boolean;
  created_at: Date;
  updated_at: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    email_notifications: { type: Boolean, default: true },
    sms_notifications: { type: Boolean, default: false },
    whatsapp_notifications: { type: Boolean, default: false },
    notify_payments: { type: Boolean, default: true },
    notify_attendance: { type: Boolean, default: true },
    notify_assessments: { type: Boolean, default: true },
    notify_enrollments: { type: Boolean, default: true },
    notify_announcements: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationPreferenceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const NotificationPreference: Model<INotificationPreference> =
  mongoose.models.NotificationPreference ||
  mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);
export default NotificationPreference;
