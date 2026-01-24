import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  student: mongoose.Types.ObjectId;
  amount: number;
  month: string;
  paymentDate: Date;
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer';
  receiptNumber: string;
  recordedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: /^\d{4}-\d{2}$/,
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'bank_transfer'],
      default: 'cash',
    },
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      // REMOVED: index: true (causing duplicate)
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorded by is required'],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ student: 1, month: 1 });
PaymentSchema.index({ paymentDate: 1 });
PaymentSchema.index({ receiptNumber: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
