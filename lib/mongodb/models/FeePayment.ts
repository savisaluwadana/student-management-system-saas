import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeePayment extends Document {
  _id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  class_id?: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'waived' | 'unpaid';
  payment_month: string; // YYYY-MM-DD (first day of month)
  due_date?: string;
  payment_date?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const FeePaymentSchema = new Schema<IFeePayment>(
  {
    student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    class_id: { type: Schema.Types.ObjectId, ref: 'Class' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue', 'waived', 'unpaid'], default: 'pending' },
    payment_month: { type: String, required: true },
    due_date: { type: String },
    payment_date: { type: String },
    payment_method: { type: String },
    transaction_id: { type: String },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

FeePaymentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const FeePayment: Model<IFeePayment> = mongoose.models.FeePayment || mongoose.model<IFeePayment>('FeePayment', FeePaymentSchema);
export default FeePayment;
