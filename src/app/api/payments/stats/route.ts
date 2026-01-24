import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../../lib/mongodb';
import Payment                       from '../../../../../models/Payment';
import Student                       from '../../../../../models/Student';
import User                          from '../../../../../models/User';

interface PaymentWithStudent {
  amount: number;
  status: string;
  paymentType: string;
  paymentDate: Date;  // ✅ ADDED THIS LINE
  student: {
    classLevel: string;
  };
}

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
    const classLevel = searchParams.get('classLevel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: Record<string, unknown> = {};

    // Date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        (query.paymentDate as Record<string, unknown>).$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (query.paymentDate as Record<string, unknown>).$lte = end;
      }
    }

    let payments = await Payment.find(query)
      .populate('student', 'classLevel')
      .lean() as unknown as PaymentWithStudent[];

    // Filter by class level
    if (classLevel && classLevel !== 'all') {
      payments = payments.filter(
        (payment) => payment.student && payment.student.classLevel === classLevel
      );
    }

    // Calculate stats
    const totalPayments = payments.length;
    
    if (totalPayments === 0) {
      return NextResponse.json({
        stats: {
          totalPayments: 0,
          totalRevenue: 0,
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0,
          averagePayment: 0,
          totalStudents: 0,
          paymentTypeBreakdown: [],
          monthlyRevenue: [],
        },
      });
    }

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const overdueCount = payments.filter(p => p.status === 'overdue').length;
    const averagePayment = Math.round(totalRevenue / totalPayments);

    // Payment type breakdown
    const typeMap = new Map<string, { count: number; total: number }>();
    payments.forEach(payment => {
      const existing = typeMap.get(payment.paymentType) || { count: 0, total: 0 };
      typeMap.set(payment.paymentType, {
        count: existing.count + 1,
        total: existing.total + payment.amount,
      });
    });

    const paymentTypeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      total: data.total,
      average: Math.round(data.total / data.count),
    }));

    // Monthly revenue (last 6 months)
    const monthlyMap = new Map<string, number>();
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + payment.amount);
    });

    const monthlyRevenue = Array.from(monthlyMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    // Count students
    const studentQuery: Record<string, unknown> = { status: 'active' };
    if (classLevel && classLevel !== 'all') {
      studentQuery.classLevel = classLevel;
    }
    const totalStudents = await Student.countDocuments(studentQuery);

    return NextResponse.json({
      stats: {
        totalPayments,
        totalRevenue,
        paidCount,
        pendingCount,
        overdueCount,
        averagePayment,
        totalStudents,
        paymentTypeBreakdown,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment stats' },
      { status: 500 }
    );
  }
}
