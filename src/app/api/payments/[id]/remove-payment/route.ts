import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '@/lib/mongodb';
import Payment                       from '@/models/Payment';

type Params = { id: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    const { receiptNumber } = body;
    if (!receiptNumber) {
      return NextResponse.json({ error: 'Receipt number is required' }, { status: 400 });
    }

    // 1. Find the payment record
    const paymentRecord = await Payment.findById(id);
    if (!paymentRecord) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });

    // 2. Find the specific payment entry to remove
    const paymentToRemove = paymentRecord.payments.find(
      (p: any) => p.receiptNumber === receiptNumber
    );
    
    if (!paymentToRemove) {
      return NextResponse.json({ error: 'Payment entry not found' }, { status: 404 });
    }

    // 3. Remove the payment entry from the array
    paymentRecord.payments = paymentRecord.payments.filter(
      (p: any) => p.receiptNumber !== receiptNumber
    );

    // 4. Update the total amount paid
    paymentRecord.amountPaid -= paymentToRemove.amount;

    // 5. Save (this triggers the pre-save hook to recalculate balance and status)
    await paymentRecord.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Payment entry removed successfully',
      amountRemoved: paymentToRemove.amount,
      newBalance: paymentRecord.balance
    });
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error removing payment entry';
    console.error('Remove Payment Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}