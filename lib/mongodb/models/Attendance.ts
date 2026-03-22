import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  marked_by?: mongoose.Types.ObjectId;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
    marked_by: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AttendanceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Unique constraint replicating Supabase's onConflict: 'class_id,student_id,date'
AttendanceSchema.index({ class_id: 1, student_id: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
