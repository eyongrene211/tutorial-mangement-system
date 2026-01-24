import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Student                       from 'models/Student';
import Grade                         from 'models/Grade';
import Attendance                    from 'models/Attendance';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('📊 Fetching overview report...', { startDate, endDate });

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get counts with parallel queries
    const [totalStudents, activeStudents, totalGrades, totalAttendance] = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ status: 'active' }),
      Grade.countDocuments(Object.keys(dateFilter).length > 0 ? { testDate: dateFilter } : {}),
      Attendance.countDocuments(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    ]);

    const overview = {
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      totalGrades,
      totalAttendance,
    };

    console.log('✅ Overview report generated:', overview);

    return NextResponse.json(overview);
  } catch (error) {
    console.error('❌ Error generating overview report:', error);
    return NextResponse.json(
      { error: 'Failed to generate overview report' },
      { status: 500 }
    );
  }
}
