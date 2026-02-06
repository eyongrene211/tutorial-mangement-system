import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '@/lib/mongodb';
import Payment                       from '@/models/Payment';

type Params = { id: string };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const payment = await Payment.findById(id);
    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.month) payment.month = body.month;
    if (body.totalAmount !== undefined) payment.totalAmount = Number(body.totalAmount);

    await payment.save(); 

    return NextResponse.json({ success: true, message: 'Updated' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const deleted = await Payment.findByIdAndDelete(id);
    
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}