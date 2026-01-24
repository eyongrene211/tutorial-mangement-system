import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../../lib/mongodb';
import User                          from '../../../../../models/User';
import Attendance                    from '../../../../../models/Attendance';


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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    interface DateFilter {
      $gte?: Date;
      $lte?: Date;
    }

    interface AttendanceQuery {
      date?: DateFilter;
      student?: { $in: unknown[] };
    }

    const query: AttendanceQuery = {};

    // Date filter
    if (startDate || endDate) {
      const dateFilter: DateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      query.date = dateFilter;
    }

    // Parents can only see their children's attendance
    if (currentUser.role === 'parent' && currentUser.students) {
      query.student = { $in: currentUser.students };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName classLevel')
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });

    // Calculate stats
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.status === 'late').length;
    const excusedCount = attendance.filter(a => a.status === 'excused').length;

    const attendanceRate = totalRecords > 0 
      ? Math.round((presentCount / totalRecords) * 100 * 10) / 10 
      : 0;

    return NextResponse.json({
      attendance,
      stats: {
        total: totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance stats' }, { status: 500 });
  }
}
