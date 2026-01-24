import { NextRequest, NextResponse }  from 'next/server';
import { auth }                       from '@clerk/nextjs/server';
import dbConnect                      from 'lib/mongodb';
import Grade                          from 'models/Grade';
import Student                        from 'models/Student';

interface GradeQueryFilter extends Record<string, unknown> {
  subject?: string;
  testType?: string;
  testDate?: Record<string, Date>;
}

// GET - Fetch all grades with filters
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const testType = searchParams.get('testType');
    const classLevel = searchParams.get('classLevel');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: GradeQueryFilter = {};

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (testType && testType !== 'all') {
      query.testType = testType;
    }

    if (startDate || endDate) {
      query.testDate = {};
      if (startDate) query.testDate.$gte = new Date(startDate);
      if (endDate) query.testDate.$lte = new Date(endDate);
    }

    // Fetch grades with populated student data
    let grades = await Grade.find(query)
      .populate('student', 'firstName lastName classLevel')
      .sort({ testDate: -1 })
      .lean()
      .exec();

    // ✅ Filter out grades with deleted/null students
    grades = grades.filter(grade => grade.student && grade.student !== null);

    // Filter by class level if specified
    if (classLevel && classLevel !== 'all') {
      grades = grades.filter(
        (grade: { student: { classLevel?: string } }) => 
          grade.student?.classLevel === classLevel
      );
    }

    // Filter by student ID if specified
    if (studentId && studentId !== 'all') {
      grades = grades.filter(
        (grade: { student: { _id?: { toString: () => string } } }) => 
          grade.student?._id?.toString() === studentId
      );
    }

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}

// POST - Create new grade
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    
    console.log('📥 Received grade data:', body);

    const { student, subject, testName, testDate, score, maxScore, testType, notes } = body;

    // ✅ Detailed validation with specific error messages
    if (!student) {
      console.log('❌ Validation failed: student missing');
      return NextResponse.json(
        { error: 'Student is required' },
        { status: 400 }
      );
    }

    if (!subject) {
      console.log('❌ Validation failed: subject missing');
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!testName || testName.trim() === '') {
      console.log('❌ Validation failed: testName missing or empty');
      return NextResponse.json(
        { error: 'Test name is required' },
        { status: 400 }
      );
    }

    if (!testDate) {
      console.log('❌ Validation failed: testDate missing');
      return NextResponse.json(
        { error: 'Test date is required' },
        { status: 400 }
      );
    }

    if (score === undefined || score === null || score === '') {
      console.log('❌ Validation failed: score missing');
      return NextResponse.json(
        { error: 'Score is required' },
        { status: 400 }
      );
    }

    if (maxScore === undefined || maxScore === null || maxScore === '') {
      console.log('❌ Validation failed: maxScore missing');
      return NextResponse.json(
        { error: 'Max score is required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      console.log('❌ Student not found:', student);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    console.log('✅ Student found:', studentExists.firstName, studentExists.lastName);

    // Parse scores
    const scoreValue = parseFloat(score);
    const maxScoreValue = parseFloat(maxScore);

    if (isNaN(scoreValue) || isNaN(maxScoreValue)) {
      return NextResponse.json(
        { error: 'Score and max score must be valid numbers' },
        { status: 400 }
      );
    }

    if (scoreValue < 0 || maxScoreValue <= 0) {
      return NextResponse.json(
        { error: 'Score must be positive and max score must be greater than 0' },
        { status: 400 }
      );
    }

    if (scoreValue > maxScoreValue) {
      return NextResponse.json(
        { error: 'Score cannot exceed max score' },
        { status: 400 }
      );
    }

    // Calculate percentage
    const percentage = Math.round((scoreValue / maxScoreValue) * 100);

    // Create grade
    const gradeData = {
      student,
      subject,
      testName: testName.trim(),
      testDate: new Date(testDate),
      score: scoreValue,
      maxScore: maxScoreValue,
      percentage,
      testType: testType || 'exam',
      notes: notes?.trim() || undefined,
    };

    console.log('✅ Creating grade with data:', gradeData);

    const grade = await Grade.create(gradeData);

    // Populate student data before returning
    const populatedGrade = await Grade.findById(grade._id)
      .populate('student', 'firstName lastName classLevel')
      .lean()
      .exec();

    console.log('✅ Grade created successfully:', grade._id);

    return NextResponse.json(populatedGrade, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating grade:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create grade' },
      { status: 500 }
    );
  }
}
