import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from '@/lib/mongodb';
import Payment                       from '@/models/Payment';

type Params = { id: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const paymentRecord = await Payment.findById(id);
    if (!paymentRecord) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Generate receipt number
    const receipt = `TUT-${new Date().getFullYear()}-${paymentRecord.payments.length + 1}-${Math.floor(100 + Math.random() * 899)}`;

    // Add new payment entry
    paymentRecord.payments.push({
      amount: Number(body.amount),
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      paymentMethod: body.paymentMethod || 'cash',
      receiptNumber: receipt,
      receivedBy: userId,
      notes: body.notes || '',
    });

    // Important: amountPaid and status are updated automatically by our pre-save hook
    await paymentRecord.save();

    return NextResponse.json({ success: true, message: 'Installment added successfully' });
  } catch (error: any) {
    console.error('Add Installment Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}