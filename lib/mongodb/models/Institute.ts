import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInstitute extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const InstituteSchema = new Schema<IInstitute>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    logo_url: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InstituteSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Institute: Model<IInstitute> = mongoose.models.Institute || mongoose.model<IInstitute>('Institute', InstituteSchema);
export default Institute;
