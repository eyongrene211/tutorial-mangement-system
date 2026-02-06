import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentEntry {
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'card';
  receiptNumber: string;
  receivedBy: string;
  notes?: string;
}

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  classLevel: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid';
  currency: string;
  payments: IPaymentEntry[];
  createdBy: string;
}

const PaymentSchema = new Schema<IPayment>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  classLevel: { 
    type: String, 
    required: true,
    enum: [
      'Form1', 'Form2', 'Form3', 'Form4', 'Form5', 'LowerSixth', 'UpperSixth',
      'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth'
    ] 
  },
  month: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'partial', 'paid'], 
    default: 'pending' 
  },
  currency: { type: String, default: 'XAF' },
  payments: [{
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'bank_transfer', 'card'] },
    receiptNumber: String,
    receivedBy: String,
    notes: String
  }],
  createdBy: { type: String, required: true }
}, { timestamps: true });

// --- THE FIXED MIDDLEWARE ---
// Use an async function without 'next'. Mongoose identifies this and handles it correctly.
PaymentSchema.pre('save', async function (this: IPayment) {
  // 1. Calculate amountPaid from all payment entries
  if (this.payments && this.payments.length > 0) {
    this.amountPaid = this.payments.reduce((acc, curr) => acc + curr.amount, 0);
  }

  // 2. Calculate balance
  this.balance = this.totalAmount - this.amountPaid;

  // 3. Determine status
  if (this.amountPaid <= 0) {
    this.status = 'pending';
  } else if (this.amountPaid >= this.totalAmount) {
    this.status = 'paid';
    this.balance = 0; 
  } else {
    this.status = 'partial';
  }
  
  // No next() call needed for async middleware
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);