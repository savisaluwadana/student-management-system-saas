import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  student_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  barcode?: string;
  notes?: string;
  institute_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    student_code: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    email: { type: String, lowercase: true },
    phone: { type: String },
    date_of_birth: { type: String },
    gender: { type: String },
    address: { type: String },
    guardian_name: { type: String },
    guardian_phone: { type: String },
    guardian_email: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'graduated', 'suspended'], default: 'active' },
    barcode: { type: String },
    notes: { type: String },
    institute_id: { type: Schema.Types.ObjectId, ref: 'Institute' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

StudentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export default Student;
