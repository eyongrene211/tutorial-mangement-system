import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';

import connectDB                     from '@/lib/mongodb';
import Payment                       from '@/models/Payment';
import Student                       from '@/models/Student';

// GET - Fetch payments
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const parentId = searchParams.get('parentId');

    let payments;

    if (role === 'admin') {
      payments = await Payment.find()
        .populate({
          path: 'studentId',
          select: 'firstName lastName classLevel clerkUserId',
        })
        .populate({
          path: 'parentId',
          select: 'firstName lastName clerkUserId email phone',
        })
        .sort({ createdAt: -1 })
        .lean();
    } else if (role === 'parent' && parentId) {
      payments = await Payment.find({ parentId })
        .populate({
          path: 'studentId',
          select: 'firstName lastName classLevel',
        })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Filter out null references
    payments = payments.filter(p => p.studentId && p.parentId);

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST - Create new payment record or add payment to existing record (Admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      studentId,
      month,
      totalAmount,
      paymentAmount,
      paymentMethod,
      paymentDate,
      notes,
    } = body;

    // Validate student exists
    const student = await Student.findById(studentId).populate('parentId');
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.parentId) {
      return NextResponse.json({ error: 'Student has no parent' }, { status: 400 });
    }

    // Check if payment record exists for this student and month
    let paymentRecord = await Payment.findOne({ studentId, month });

    // Generate receipt number
    const year = new Date().getFullYear();
    const count = await Payment.countDocuments();
    const receiptNumber = `TUT-${year}-${String(count + 1).padStart(5, '0')}`;

    if (paymentRecord) {
      // Add to existing payment record
      paymentRecord.payments.push({
        amount: paymentAmount,
        paymentDate: paymentDate || new Date(),
        paymentMethod,
        receiptNumber,
        receivedBy: userId,
        notes,
      });
      paymentRecord.amountPaid += paymentAmount;
      await paymentRecord.save();
    } else {
      // Create new payment record
      paymentRecord = await Payment.create({
        studentId,
        parentId: student.parentId._id,
        classLevel: student.classLevel,
        month,
        totalAmount,
        amountPaid: paymentAmount,
        payments: [{
          amount: paymentAmount,
          paymentDate: paymentDate || new Date(),
          paymentMethod,
          receiptNumber,
          receivedBy: userId,
          notes,
        }],
        createdBy: userId,
      });
    }

    const populatedPayment = await Payment.findById(paymentRecord._id)
      .populate('studentId', 'firstName lastName classLevel')
      .populate('parentId', 'firstName lastName email phone')
      .lean();

    return NextResponse.json({ 
      success: true, 
      payment: populatedPayment 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
