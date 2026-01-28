import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Grade                         from 'models/Grade';
import User                          from 'models/User';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let query = {};
    if (studentId) {
      query = { student: studentId };
    }

    const grades = await Grade.find(query)
      .populate('student', 'firstName lastName classLevel')
      .sort({ testDate: -1 })
      .lean();

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
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
    const {
      student,
      subject,
      testName,
      testType,
      testDate,
      score,
      maxScore,
      percentage,
      term,
      notes,
      remarks, // ✅ ADDED THIS
    } = body;

    // Validation
    if (!student || !subject || !testName || !testType || !testDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || typeof maxScore !== 'number' || maxScore <= 0) {
      return NextResponse.json(
        { error: 'Invalid score values' },
        { status: 400 }
      );
    }

    const newGrade = await Grade.create({
      student,
      subject,
      testName,
      testType,
      testDate: new Date(testDate),
      score,
      maxScore,
      percentage,
      term: term || 'Term 1',
      notes: notes || '',
      remarks: remarks || '', // ✅ ADDED THIS
    });

    console.log('✅ Created grade:', newGrade._id);

    // Populate student info for response
    const populatedGrade = await Grade.findById(newGrade._id)
      .populate('student', 'firstName lastName classLevel')
      .lean();

    return NextResponse.json(populatedGrade, { status: 201 });
  } catch (error) {
    console.error('Error creating grade:', error);
    return NextResponse.json(
      { error: 'Failed to create grade' },
      { status: 500 }
    );
  }
}
