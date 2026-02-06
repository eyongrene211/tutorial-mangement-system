import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '@/lib/mongodb';
import Attendance                    from '@/models/Attendance';
import User                          from '@/models/User';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Define the shape of the update payload to avoid 'any'
interface AttendanceUpdate {
  student?: string;
  studentId?: string; // Temporarily allow this for mapping
  status?: string;
  date?: string | Date;
  subject?: string;
  remarks?: string;
  recordedBy?: string;
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
      .lean();

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

    const currentUser = await User.findOne({ clerkUserId: userId });
    if (!currentUser || currentUser.role === 'parent') {
      return NextResponse.json(
        { error: 'Access denied. Admins and tutors only.' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const body: AttendanceUpdate = await request.json();

    console.log('📝 Updating attendance:', id);
    console.log('📝 Update data:', body);

    // Map studentId to student and clean up the object
    const updatePayload: Partial<AttendanceUpdate> = { ...body };
    
    if (body.studentId && !body.student) {
      updatePayload.student = body.studentId;
    }
    
    // Always track who last modified the record
    updatePayload.recordedBy = currentUser._id.toString();

    // Remove the extra key before sending to MongoDB
    delete updatePayload.studentId;

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName classLevel')
      .lean();

    if (!updatedAttendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    console.log('✅ Updated attendance:', id);

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error('❌ Error updating attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to update attendance record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    const currentUser = await User.findOne({ clerkUserId: userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

    const deletedAttendance = await Attendance.findByIdAndDelete(id);

    if (!deletedAttendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    console.log('✅ Deleted attendance:', id);

    return NextResponse.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting attendance:', error);
    return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 });
  }
}