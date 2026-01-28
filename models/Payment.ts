import mongoose from 'mongoose';

export interface IPayment extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  classLevel: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  paymentStatus: 'not_paid' | 'partial' | 'completed' | 'overpaid';
  payments: Array<{
    amount: number;
    paymentDate: Date;
    paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'mobile_money';
    receiptNumber: string;
    receivedBy: string;
    notes?: string;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new mongoose.Schema<IPayment>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    classLevel: {
      type: String,
      enum: ['Form1', 'Form2', 'Form3', 'Form4', 'Form5', 'LowerSixth', 'UpperSixth'],
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'XAF',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['not_paid', 'partial', 'completed', 'overpaid'],
      default: 'not_paid',
    },
    payments: [{
      amount: {
        type: Number,
        required: true,
      },
      paymentDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
      paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'card', 'mobile_money'],
        required: true,
      },
      receiptNumber: {
        type: String,
        required: true,
      },
      receivedBy: {
        type: String,
        required: true,
      },
      notes: String,
    }],
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ FIXED: Removed next() callback - not needed in Mongoose 6+
PaymentSchema.pre('save', function() {
  // Calculate balance
  this.balance = this.totalAmount - this.amountPaid;
  
  // Determine payment status
  if (this.amountPaid === 0) {
    this.paymentStatus = 'not_paid';
  } else if (this.amountPaid < this.totalAmount) {
    this.paymentStatus = 'partial';
  } else if (this.amountPaid === this.totalAmount) {
    this.paymentStatus = 'completed';
  } else {
    this.paymentStatus = 'overpaid';
  }
  // No next() call needed
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
