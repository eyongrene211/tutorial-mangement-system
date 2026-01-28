import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '@/lib/mongodb';
import Grade                         from '@/models/Grade';

// GET single grade
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const grade = await Grade.findById(id)
      .populate('student', 'firstName lastName classLevel')
      .lean();

    if (!grade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    return NextResponse.json(grade, { status: 200 });
  } catch (error) {
    console.error('Error fetching grade:', error);
    return NextResponse.json({ error: 'Failed to fetch grade' }, { status: 500 });
  }
}

// UPDATE grade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    console.log('📥 Received update payload:', body);

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

    // Update grade
    const updatedGrade = await Grade.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true, runValidators: true }
    ).populate('student', 'firstName lastName classLevel');

    if (!updatedGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    console.log('✅ Grade updated successfully:', updatedGrade);

    return NextResponse.json(updatedGrade, { status: 200 });
  } catch (error) {
    // ✅ FIXED: Typed the error properly
    console.error('❌ Error updating grade:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 });
  }
}

// DELETE grade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const deletedGrade = await Grade.findByIdAndDelete(id);

    if (!deletedGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Grade deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting grade:', error);
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 });
  }
}
