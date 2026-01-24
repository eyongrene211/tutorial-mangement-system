import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Student                       from 'models/Student';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const classLevel = searchParams.get('classLevel');

    console.log('💰 Fetching financial report...', { classLevel });

    // Build student query
    const studentQuery: Record<string, unknown> = { status: 'active' };
    if (classLevel && classLevel !== 'all') {
      studentQuery.classLevel = classLevel;
    }

    // Get all active students
    const students = await Student.find(studentQuery)
      .select('firstName lastName classLevel parentInfo')
      .lean()
      .exec();

    console.log(`✅ Found ${students.length} students`);

    // Generate financial report for each student
    // NOTE: This uses mock data - replace with actual payment records when implemented
    const financialReports = students.map((student) => {
      // Mock financial data - replace with actual payment tracking
      const monthlyFee = 25000; // Default fee in FCFA
      const months = 3; // Number of months
      const expectedTotal = monthlyFee * months;
      
      // Generate realistic mock payment data
      const randomPercentage = Math.random();
      let paid = 0;
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';

      if (randomPercentage > 0.7) {
        // 30% fully paid
        paid = expectedTotal;
        status = 'paid';
      } else if (randomPercentage > 0.3) {
        // 40% partially paid
        paid = Math.floor(expectedTotal * (0.3 + Math.random() * 0.6));
        status = 'partial';
      } else {
        // 30% unpaid
        paid = 0;
        status = 'unpaid';
      }

      const balance = expectedTotal - paid;

      return {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          classLevel: student.classLevel,
        },
        monthlyFee,
        expectedTotal,
        paid,
        balance,
        status,
        parentContact: student.parentInfo?.phone || 'N/A',
      };
    });

    console.log(`✅ Generated ${financialReports.length} financial reports`);

    return NextResponse.json(financialReports);
  } catch (error) {
    console.error('❌ Error generating financial report:', error);
    return NextResponse.json(
      { error: 'Failed to generate financial report' },
      { status: 500 }
    );
  }
}
