import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import Grade                         from '@/models/Grade';
import connectDB                     from '@/lib/mongodb';


// GET all grades
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const grades = await Grade.find({})
      .populate('student', 'firstName lastName classLevel')
      .sort({ testDate: -1 })
      .lean();

    return NextResponse.json(grades, { status: 200 });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}

// POST - Create new grade
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    console.log('📥 Received create payload:', body);

    const { student, subject, testName, testDate, score, maxScore, percentage, testType, term, notes, remarks } = body;

    // Validation
    if (!student) {
      return NextResponse.json({ error: 'Student is required' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!testName) {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 });
    }
    if (!testDate) {
      return NextResponse.json({ error: 'Test date is required' }, { status: 400 });
    }
    if (score === undefined || score === null) {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 });
    }
    if (maxScore === undefined || maxScore === null) {
      return NextResponse.json({ error: 'Max score is required' }, { status: 400 });
    }

    const scoreNum = parseFloat(score);
    const maxScoreNum = parseFloat(maxScore);

    if (isNaN(scoreNum) || isNaN(maxScoreNum)) {
      return NextResponse.json({ error: 'Scores must be valid numbers' }, { status: 400 });
    }

    if (scoreNum < 0) {
      return NextResponse.json({ error: 'Score cannot be negative' }, { status: 400 });
    }

    if (maxScoreNum <= 0) {
      return NextResponse.json({ error: 'Max score must be greater than 0' }, { status: 400 });
    }

    if (scoreNum > maxScoreNum) {
      return NextResponse.json({ error: 'Score cannot be greater than max score' }, { status: 400 });
    }

    // Calculate percentage if not provided
    const calculatedPercentage = percentage || Math.round((scoreNum / maxScoreNum) * 100);

    // Create grade
    const newGrade = await Grade.create({
      student: student,
      subject: subject,
      testName: testName,
      testType: testType || 'quiz',
      testDate: new Date(testDate),
      score: scoreNum,
      maxScore: maxScoreNum,
      percentage: calculatedPercentage,
      term: term || 'Term 1',
      notes: notes || '',
      remarks: remarks || '',
    });

    // Populate student info
    const populatedGrade = await Grade.findById(newGrade._id)
      .populate('student', 'firstName lastName classLevel')
      .lean();

    console.log('✅ Grade created successfully:', populatedGrade);

    return NextResponse.json(populatedGrade, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating grade:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 });
  }
}
