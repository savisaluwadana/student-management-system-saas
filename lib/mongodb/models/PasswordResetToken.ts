import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPasswordResetToken extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  token_hash: string;
  expires_at: Date;
  used_at?: Date;
  created_at: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token_hash: { type: String, required: true, unique: true, index: true },
    expires_at: { type: Date, required: true, index: true },
    used_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

PasswordResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

export default PasswordResetToken;
