import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../lib/mongodb';
import Payment                       from '../../../../models/Payment';
import Student                       from '../../../../models/Student';
import User                          from '../../../../models/User';

// Generate unique receipt number
function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REC-${year}${month}-${random}`;
}

// GET all payments
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    interface PaymentQuery {
      student?: string | { $in: unknown[] };
      month?: string;
      paymentDate?: { $gte: Date; $lte: Date };
    }

    const query: PaymentQuery = {};

    if (studentId) {
      query.student = studentId;
    }

    if (month) {
      query.month = month;
    }

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Parents can only see their children's payments
    if (currentUser.role === 'parent' && currentUser.students) {
      query.student = { $in: currentUser.students };
    }

    const payments = await Payment.find(query)
      .populate('student', 'firstName lastName classLevel monthlyFee')
      .populate('recordedBy', 'firstName lastName')
      .sort({ paymentDate: -1 });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST - Create payment
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser || currentUser.role === 'parent') {
      return NextResponse.json(
        { error: 'Access denied. Admins and tutors only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, amount, month, paymentDate, paymentMethod, notes } = body;

    // Validation
    if (!studentId || !amount || !month || !paymentDate) {
      return NextResponse.json(
        { error: 'Student, amount, month, and payment date are required' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if payment already exists for this student and month
    const existingPayment = await Payment.findOne({
      student: studentId,
      month,
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already recorded for this student and month' },
        { status: 400 }
      );
    }

    // Generate receipt number
    const receiptNumber = generateReceiptNumber();

    const newPayment = await Payment.create({
      student: studentId,
      amount,
      month,
      paymentDate: new Date(paymentDate),
      paymentMethod: paymentMethod || 'cash',
      receiptNumber,
      recordedBy: currentUser._id,
      notes: notes || '',
    });

    const populatedPayment = await Payment.findById(newPayment._id)
      .populate('student', 'firstName lastName classLevel')
      .populate('recordedBy', 'firstName lastName');

    return NextResponse.json(populatedPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
