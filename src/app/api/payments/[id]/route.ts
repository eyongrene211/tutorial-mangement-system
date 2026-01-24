import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../../lib/mongodb';
import Payment                       from '../../../../../models/Payment';
import User                          from '../../../../../models/User';


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET single payment
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const params = await context.params;
    const { id } = params;

    const payment = await Payment.findById(id)
      .populate('student', 'firstName lastName classLevel monthlyFee')
      .populate('recordedBy', 'firstName lastName');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}

// PUT - Update payment
export async function PUT(request: NextRequest, context: RouteParams) {
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

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName classLevel')
      .populate('recordedBy', 'firstName lastName');

    if (!updatedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

// DELETE - Delete payment
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

    const deletedPayment = await Payment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
