import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import mongoose         from 'mongoose';
import connectDB        from '../../../../../lib/mongodb';

const ClassLevelsSchema = new mongoose.Schema({
  classLevels: [String],
  updatedAt: { type: Date, default: Date.now },
});

const ClassLevels = mongoose.models.ClassLevels || mongoose.model('ClassLevels', ClassLevelsSchema);

export async function GET() {
  try {
    await connectDB();

    let classLevelsDoc = await ClassLevels.findOne();

    if (!classLevelsDoc) {
      // Create default class levels
      classLevelsDoc = await ClassLevels.create({
        classLevels: [
          'Nursery 1',
          'Nursery 2',
          'Nursery 3',
          'Primary 1',
          'Primary 2',
          'Primary 3',
          'Primary 4',
          'Primary 5',
          'Primary 6',
          'Form 1',
          'Form 2',
          'Form 3',
          'Form 4',
          'Form 5',
          'Lower Sixth',
          'Upper Sixth',
        ],
      });
    }

    return NextResponse.json({ classLevels: classLevelsDoc.classLevels });
  } catch (error) {
    console.error('Error fetching class levels:', error);
    return NextResponse.json({ error: 'Failed to fetch class levels' }, { status: 500 });
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
    const { classLevels } = body;

    await ClassLevels.findOneAndUpdate(
      {},
      { classLevels, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, classLevels });
  } catch (error) {
    console.error('Error updating class levels:', error);
    return NextResponse.json({ error: 'Failed to update class levels' }, { status: 500 });
  }
}
