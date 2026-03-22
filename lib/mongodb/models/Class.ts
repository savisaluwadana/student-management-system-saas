import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClass extends Document {
  _id: mongoose.Types.ObjectId;
  class_code: string;
  class_name: string;
  subject?: string;
  description?: string;
  teacher_id?: mongoose.Types.ObjectId;
  institute_id?: mongoose.Types.ObjectId;
  schedule?: string;
  fee_amount?: number;
  status: 'active' | 'inactive' | 'completed';
  created_at: Date;
  updated_at: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    class_code: { type: String, required: true, unique: true },
    class_name: { type: String, required: true },
    subject: { type: String },
    description: { type: String },
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User' },
    institute_id: { type: Schema.Types.ObjectId, ref: 'Institute' },
    schedule: { type: String },
    fee_amount: { type: Number },
    status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ClassSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Class: Model<IClass> = mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
export default Class;
