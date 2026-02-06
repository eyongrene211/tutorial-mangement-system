import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '@/lib/mongodb';
import Payment                       from '@/models/Payment';
import Student                       from '@/models/Student';
import mongoose                      from 'mongoose';

interface PaymentRequestBody {
  studentId: string;
  totalAmount: number;
  amountPaid?: number;
  month: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

interface ErrorDetail {
  path: string;
  message: string;
}

function normalizeClassLevel(classLevel: string): string {
  if (!classLevel) return 'Form 1';
  
  const clean = classLevel.trim();
  
  const validEnums = [
    'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 
    'Lower Sixth', 'Upper Sixth', 
    'Form1', 'Form2', 'Form3', 'Form4', 'Form5', 
    'LowerSixth', 'UpperSixth'
  ];

  if (validEnums.includes(clean)) return clean;
  
  return clean.replace(/(\D+)(\d+)/, '$1 $2'); 
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const parentId = searchParams.get('parentId');
    
    console.log('📋 Payment API GET request:', { role, parentId });
    
    const query = role === 'parent' && parentId 
      ? { parentId } 
      : {};
    
    console.log('🔍 Using query:', query);
    
    const payments = await Payment.find(query)
      .populate('studentId', 'firstName lastName classLevel')
      .populate('parentId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${payments.length} payments ${parentId ? 'for parent ' + parentId : 'total'}`);
    
    if (payments.length > 0) {
      console.log('📦 Sample payment:', {
        _id: payments[0]._id,
        studentId: payments[0].studentId,
        parentId: payments[0].parentId,
        status: payments[0].status,
        month: payments[0].month
      });
    }
    
    return NextResponse.json({ payments });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Fetch Payments Error:', errorMessage);
    return NextResponse.json({ 
      error: 'Failed to fetch payments',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json() as PaymentRequestBody;

    console.log('📝 Creating payment for student:', body.studentId);

    if (!body.studentId || !body.totalAmount) {
      return NextResponse.json({ error: 'Student and Total Amount are required' }, { status: 400 });
    }

    const student = await Student.findById(body.studentId).lean();
    if (!student) {
      console.error('❌ Student not found:', body.studentId);
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    console.log('👨‍👩‍👧 Student found:', {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      parentUser: student.parentUser,
      hasParent: !!student.parentUser
    });

    if (!student.parentUser) {
      return NextResponse.json({ 
        error: 'This student has no parent user assigned. Please link a parent to this student first.' 
      }, { status: 400 });
    }

    const receiptNumber = `TUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialPaymentEntry = {
      amount: Number(body.amountPaid || 0),
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      paymentMethod: body.paymentMethod || 'cash',
      receiptNumber: receiptNumber,
      receivedBy: userId,
      notes: body.notes || 'Initial payment',
    };

    const normalizedClassLevel = normalizeClassLevel(student.classLevel || '');

    const newPayment = new Payment({
      studentId: student._id,
      parentId: student.parentUser,
      classLevel: normalizedClassLevel,
      month: body.month,
      totalAmount: Number(body.totalAmount),
      amountPaid: Number(body.amountPaid || 0),
      currency: 'XAF',
      payments: [initialPaymentEntry],
      createdBy: userId,
    });

    await newPayment.save();

    console.log('✅ Payment created successfully:', {
      id: newPayment._id,
      receiptNumber,
      status: newPayment.status,
      balance: newPayment.balance
    });

    const populatedPayment = await Payment.findById(newPayment._id)
      .populate('studentId', 'firstName lastName classLevel')
      .populate('parentId', 'firstName lastName email phone')
      .lean();

    return NextResponse.json({ 
      success: true, 
      message: 'Payment record created successfully',
      payment: populatedPayment 
    }, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Payment POST Error:', error);
    
    // ✅ PERFECT: Simple, safe, TypeScript-compliant error handling
    if (error instanceof mongoose.Error.ValidationError && error.errors) {
      const errorDetails: ErrorDetail[] = Object.keys(error.errors).map((field) => {
        const err = error.errors[field];
        return {
          path: field,
          message: typeof err === 'object' && err !== null && 'message' in err 
            ? String(err.message) 
            : `Invalid value for ${field}`
        };
      });

      console.error('Validation errors:', errorDetails);
      return NextResponse.json({ 
        error: 'Validation failed',
        details: errorDetails,
        message: errorMessage
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage 
    }, { status: 500 });
  }
}
