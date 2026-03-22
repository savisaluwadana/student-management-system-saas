import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assessment_type: 'quiz' | 'test' | 'exam' | 'assignment' | 'project' | 'other';
  max_score: number;
  weight?: number;
  date: string;
  due_date?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true },
    description: { type: String },
    assessment_type: {
      type: String,
      enum: ['quiz', 'test', 'exam', 'assignment', 'project', 'other'],
      default: 'other',
    },
    max_score: { type: Number, required: true, default: 100 },
    weight: { type: Number },
    date: { type: String, required: true },
    due_date: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AssessmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Assessment: Model<IAssessment> = mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
export default Assessment;
