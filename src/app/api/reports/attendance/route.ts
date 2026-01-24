import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Attendance                    from 'models/Attendance';
import Student                       from 'models/Student';

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
    const classLevel = searchParams.get('classLevel');

    console.log('📊 Fetching attendance report...', { startDate, endDate, classLevel });

    // Build student query
    const studentQuery: Record<string, unknown> = { status: 'active' };
    if (classLevel && classLevel !== 'all') {
      studentQuery.classLevel = classLevel;
    }

    // Get all active students
    const students = await Student.find(studentQuery)
      .select('firstName lastName classLevel')
      .lean()
      .exec();

    console.log(`✅ Found ${students.length} students`);

    // Build date filter for attendance
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Generate report for each student
    const attendanceReports = await Promise.all(
      students.map(async (student) => {
        const attendanceQuery: Record<string, unknown> = { student: student._id };
        if (Object.keys(dateFilter).length > 0) {
          attendanceQuery.date = dateFilter;
        }

        const attendanceRecords = await Attendance.find(attendanceQuery).lean().exec();

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter((a) => a.status === 'present').length;
        const absentDays = attendanceRecords.filter((a) => a.status === 'absent').length;
        const lateDays = attendanceRecords.filter((a) => a.status === 'late').length;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        return {
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            classLevel: student.classLevel,
          },
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate,
          status:
            attendanceRate >= 90
              ? 'excellent'
              : attendanceRate >= 75
              ? 'good'
              : attendanceRate >= 60
              ? 'average'
              : 'poor',
        };
      })
    );

    console.log(`✅ Generated ${attendanceReports.length} attendance reports`);

    return NextResponse.json(attendanceReports);
  } catch (error) {
    console.error('❌ Error generating attendance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate attendance report' },
      { status: 500 }
    );
  }
}
