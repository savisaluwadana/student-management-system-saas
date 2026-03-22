import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITutorialProgress extends Document {
  _id: mongoose.Types.ObjectId;
  tutorial_id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const TutorialProgressSchema = new Schema<ITutorialProgress>(
  {
    tutorial_id: { type: Schema.Types.ObjectId, ref: 'Tutorial', required: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
    progress_percentage: { type: Number, default: 0 },
    started_at: { type: Date },
    completed_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TutorialProgressSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Unique per tutorial+student (for upsert)
TutorialProgressSchema.index({ tutorial_id: 1, student_id: 1 }, { unique: true });

const TutorialProgress: Model<ITutorialProgress> = mongoose.models.TutorialProgress || mongoose.model<ITutorialProgress>('TutorialProgress', TutorialProgressSchema);
export default TutorialProgress;
