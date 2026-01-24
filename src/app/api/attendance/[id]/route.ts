import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../../lib/mongodb';
import Attendance                    from '../../../../../models/Attendance';
import User                          from '../../../../../models/User';


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET single attendance record
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const params = await context.params;
    const { id } = params;

    const attendance = await Attendance.findById(id)
      .populate('student', 'firstName lastName classLevel')
      .populate('recordedBy', 'firstName lastName');

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance record' }, { status: 500 });
  }
}

// PUT - Update attendance record
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser || currentUser.role === 'parent') {
      return NextResponse.json(
        { error: 'Access denied. Admins and tutors only.' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName classLevel')
      .populate('recordedBy', 'firstName lastName');

    if (!updatedAttendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 });
  }
}

// DELETE - Delete attendance record
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

    const deletedAttendance = await Attendance.findByIdAndDelete(id);

    if (!deletedAttendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 });
  }
}
