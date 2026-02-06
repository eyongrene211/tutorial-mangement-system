import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import Attendance                    from 'models/Attendance';
import User                          from 'models/User';
import dbConnect                     from 'lib/mongodb';

interface AttendanceQuery {
  student?: string;
  date?: {
    $gte: Date;
    $lt?: Date;
    $lte?: Date;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: AttendanceQuery = {};

    if (studentId) {
      query.student = studentId;
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = {
        $gte: targetDate,
        $lt: nextDay,
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'firstName lastName classLevel')
      .sort({ date: -1 })
      .lean();

    console.log('✅ Fetched attendance records:', attendanceRecords.length);

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check user role
    const user = await User.findOne({ clerkUserId: userId });
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json(
        { error: 'Access denied. Admins and teachers only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📥 Received attendance data:', JSON.stringify(body, null, 2));

    // Handle bulk attendance save
    if (body.records && Array.isArray(body.records)) {
      const records = body.records;

      // Extract date from top-level OR from first record
      let attendanceDate = body.date;
      if (!attendanceDate && records.length > 0 && records[0].date) {
        attendanceDate = records[0].date;
      }

      if (!attendanceDate) {
        console.error('❌ No date provided in request');
        return NextResponse.json(
          { error: 'Date is required' },
          { status: 400 }
        );
      }

      console.log(`📝 Processing ${records.length} attendance records for ${attendanceDate}`);

      const targetDate = new Date(attendanceDate);
      targetDate.setHours(0, 0, 0, 0);

      const results = [];
      const errors = [];

      for (const record of records) {
        try {
          // ✅ FIXED: Accept both "student" and "studentId" keys
          const studentId = record.studentId || record.student;
          const status = record.status;

          if (!studentId || !status) {
            console.warn('⚠️ Skipping invalid record:', record);
            errors.push({ studentId, error: 'Missing studentId or status' });
            continue;
          }

          console.log(`🔄 Processing student ${studentId}: ${status}`);

          // Check if attendance already exists for this student and date
          const existingAttendance = await Attendance.findOne({
            student: studentId,
            date: targetDate,
          });

          if (existingAttendance) {
            // Update existing attendance
            existingAttendance.status = status;
            await existingAttendance.save();
            console.log(`✅ Updated attendance for student ${studentId}: ${status}`);
            results.push(existingAttendance);
          } else {
            // Create new attendance
            const newAttendance = await Attendance.create({
              student: studentId,
              date: targetDate,
              status,
            });
            console.log(`✅ Created attendance for student ${studentId}: ${status}`);
            results.push(newAttendance);
          }
        } catch (err) {
          console.error(`❌ Error processing student ${record.studentId || record.student}:`, err);
          errors.push({ 
            studentId: record.studentId || record.student, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }
      }

      console.log(`✅ Successfully processed ${results.length} records`);
      if (errors.length > 0) {
        console.log(`⚠️ Errors: ${errors.length}`, errors);
      }

      return NextResponse.json({
        success: true,
        message: `Saved attendance for ${results.length} students`,
        saved: results.length,
        errors: errors.length > 0 ? errors : undefined,
      }, { status: 201 });
    }

    // ✅ FIXED: Handle single attendance record - accept both studentId and student
    const studentId = body.studentId || body.student;
    const { date, status, subject, remarks } = body;

    console.log('🔍 Single attendance request:');
    console.log('  - studentId:', studentId);
    console.log('  - date:', date);
    console.log('  - status:', status);
    console.log('  - subject:', subject);

    if (!studentId || !date || !status) {
      console.error('❌ Missing required fields:', { studentId, date, status });
      return NextResponse.json(
        { error: 'Student, date, and status are required' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: targetDate,
    });

    if (existingAttendance) {
      existingAttendance.status = status;
      await existingAttendance.save();
      console.log('✅ Updated attendance:', existingAttendance._id);
      
      const populated = await Attendance.findById(existingAttendance._id)
        .populate('student', 'firstName lastName classLevel')
        .lean();
      
      return NextResponse.json(populated);
    }

    const newAttendance = await Attendance.create({
      student: studentId,
      date: targetDate,
      status,
    });

    console.log('✅ Created attendance:', newAttendance._id);

    const populated = await Attendance.findById(newAttendance._id)
      .populate('student', 'firstName lastName classLevel')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('❌ Error saving attendance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save attendance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}