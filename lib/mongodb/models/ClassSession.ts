import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    days_of_week: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SessionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export default Session;
