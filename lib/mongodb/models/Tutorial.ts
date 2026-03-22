import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITutorial extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  content_url?: string;
  content_type?: 'video' | 'document' | 'link' | 'other';
  class_id?: mongoose.Types.ObjectId;
  institute_id?: mongoose.Types.ObjectId;
  is_public: boolean;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const TutorialSchema = new Schema<ITutorial>(
  {
    title: { type: String, required: true },
    description: { type: String },
    content_url: { type: String },
    content_type: { type: String, enum: ['video', 'document', 'link', 'other'] },
    class_id: { type: Schema.Types.ObjectId, ref: 'Class' },
    institute_id: { type: Schema.Types.ObjectId, ref: 'Institute' },
    is_public: { type: Boolean, default: false },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TutorialSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Tutorial: Model<ITutorial> = mongoose.models.Tutorial || mongoose.model<ITutorial>('Tutorial', TutorialSchema);
export default Tutorial;
