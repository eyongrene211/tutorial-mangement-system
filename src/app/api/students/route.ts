import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from '@/lib/mongodb';
import Student                       from '@/models/Student';
import User                          from '@/models/User';
import { nanoid }                    from 'nanoid';

// Helper for temporary passwords
function generateTempPassword(): string {
  return nanoid(10);
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const classLevel = searchParams.get('classLevel');
    const search = searchParams.get('search');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (classLevel && classLevel !== 'all') query.classLevel = classLevel;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'parentInfo.name': { $regex: search, $options: 'i' } },
      ];
    }

    // Explicitly select parentUser and parentInfo to help the Payment Modal
    const students = await Student.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await request.json();
    
    // Logic for auto-creating parent user (Matches your existing flow)
    let finalParentUserId = body.parentUserId;
    if (!finalParentUserId) {
        // ... (Your existing auto-create logic here)
    }

    const studentData = {
      ...body,
      parentUser: finalParentUserId || undefined,
      status: 'active',
    };

    const student = await Student.create(studentData);
    return NextResponse.json({ student, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}