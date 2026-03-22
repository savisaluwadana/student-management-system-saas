import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'completed' | 'dropped';
  custom_fee?: number;
  enrolled_at: Date;
  created_at: Date;
  updated_at: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    status: { type: String, enum: ['active', 'inactive', 'completed', 'dropped'], default: 'active' },
    custom_fee: { type: Number },
    enrolled_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

EnrollmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Compound index for uniqueness
EnrollmentSchema.index({ student_id: 1, class_id: 1 }, { unique: true });

const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export default Enrollment;
