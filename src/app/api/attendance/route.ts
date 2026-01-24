import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Attendance                    from 'models/Attendance';
import User                          from 'models/User';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check user role
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: Record<string, unknown> = {};

    if (date) {
      query.date = new Date(date);
    }

    if (studentId) {
      query.student = studentId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (query.date as Record<string, unknown>).$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName classLevel')
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
