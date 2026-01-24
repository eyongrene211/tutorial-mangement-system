import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import connectDB        from '../../../../../lib/mongodb';
import User             from '../../../../../models/User';
import Student          from '../../../../../models/Student';
import Attendance       from '../../../../../models/Attendance';
import Grade            from '../../../../../models/Grade';

export async function GET() {
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

    // Check if user is a tutor
    if (currentUser.role !== 'tutor') {
      return NextResponse.json({ error: 'Access denied. Tutors only.' }, { status: 403 });
    }

    const tutorSubjects = currentUser.subjects || [];

    if (tutorSubjects.length === 0) {
      return NextResponse.json({
        totalStudents: 0,
        todayAttendance: 0,
        recentGrades: 0,
        mySubjects: [],
      });
    }

    // Get students taking tutor's subjects
    const students = await Student.find({
      registeredSubjects: { $in: tutorSubjects },
      status: 'active',
    });

    const studentIds = students.map(s => s._id);

    // Get today's attendance for tutor's students
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.countDocuments({
      student: { $in: studentIds },
      subject: { $in: tutorSubjects },
      date: { $gte: today, $lte: todayEnd },
      status: 'present',
    });

    // Get recent grades count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentGrades = await Grade.countDocuments({
      student: { $in: studentIds },
      subject: { $in: tutorSubjects },
      date: { $gte: sevenDaysAgo },
    });

    return NextResponse.json({
      totalStudents: students.length,
      todayAttendance,
      recentGrades,
      mySubjects: tutorSubjects,
    });
  } catch (error) {
    console.error('Error fetching tutor dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
