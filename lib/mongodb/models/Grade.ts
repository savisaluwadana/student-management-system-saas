import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGrade extends Document {
  _id: mongoose.Types.ObjectId;
  assessment_id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  score?: number;
  remarks?: string;
  graded_by?: mongoose.Types.ObjectId;
  graded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    assessment_id: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    score: { type: Number },
    remarks: { type: String },
    graded_by: { type: Schema.Types.ObjectId, ref: 'User' },
    graded_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GradeSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Unique per assessment+student (mirrors Supabase onConflict: 'assessment_id,student_id')
GradeSchema.index({ assessment_id: 1, student_id: 1 }, { unique: true });

const Grade: Model<IGrade> = mongoose.models.Grade || mongoose.model<IGrade>('Grade', GradeSchema);
export default Grade;
