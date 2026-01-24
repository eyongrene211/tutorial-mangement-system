import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../../lib/mongodb';
import Grade                         from '../../../../../models/Grade';
import User                          from '../../../../../models/User';


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET single grade
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const params = await context.params;
    const { id } = params;

    const grade = await Grade.findById(id)
      .populate('student', 'firstName lastName classLevel')
      .populate('recordedBy', 'firstName lastName');

    if (!grade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    return NextResponse.json(grade);
  } catch (error) {
    console.error('Error fetching grade:', error);
    return NextResponse.json({ error: 'Failed to fetch grade' }, { status: 500 });
  }
}

// PUT - Update grade
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

    const updatedGrade = await Grade.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName classLevel')
      .populate('recordedBy', 'firstName lastName');

    if (!updatedGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    return NextResponse.json(updatedGrade);
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 });
  }
}

// DELETE - Delete grade
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

    const deletedGrade = await Grade.findByIdAndDelete(id);

    if (!deletedGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 });
  }
}
