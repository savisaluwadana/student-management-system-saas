import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'teacher';
  workspace_id?: mongoose.Types.ObjectId;
  avatar_url?: string;
  auth_version: number;
  created_at: Date;
  updated_at: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    full_name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['admin', 'teacher'], default: 'admin' },
    workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
    avatar_url: { type: String },
    auth_version: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
