import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import mongoose         from 'mongoose';
import connectDB        from '../../../../../lib/mongodb';

const SubjectsSchema = new mongoose.Schema({
  subjects: [String],
  updatedAt: { type: Date, default: Date.now },
});

const Subjects = mongoose.models.Subjects || mongoose.model('Subjects', SubjectsSchema);

export async function GET() {
  try {
    await connectDB();

    let subjectsDoc = await Subjects.findOne();

    if (!subjectsDoc) {
      // Create default subjects
      subjectsDoc = await Subjects.create({
        subjects: [
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'French',
          'Biology',
          'History',
          'Geography'
        ],
      });
    }

    return NextResponse.json({ subjects: subjectsDoc.subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { subjects } = body;

    await Subjects.findOneAndUpdate(
      {},
      { subjects, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    console.error('Error updating subjects:', error);
    return NextResponse.json({ error: 'Failed to update subjects' }, { status: 500 });
  }
}
