import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Student                       from 'models/Student';
import User                          from 'models/User';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single student
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const student = await Student.findById(id).lean().exec();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT - Update student
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const body = await request.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      classLevel,
      parentUserId,
      parentInfo, // ✅ This is the nested object
      address,
      photoUrl,
      status,
      notes,
    } = body;

    // ✅ Validate parentInfo
    if (parentInfo && (!parentInfo.name || !parentInfo.phone)) {
      return NextResponse.json(
        { error: 'Parent name and phone are required' },
        { status: 400 }
      );
    }

    // Validate gender if provided
    if (gender && gender !== 'Male' && gender !== 'Female') {
      return NextResponse.json(
        { error: 'Gender must be either Male or Female' },
        { status: 400 }
      );
    }

    // Check if parent user exists if parentUserId is provided
    if (parentUserId) {
      const parentUser = await User.findById(parentUserId);
      if (!parentUser || parentUser.role !== 'parent') {
        return NextResponse.json(
          { error: 'Invalid parent user' },
          { status: 400 }
        );
      }
    }

    // ✅ Build update object properly
    const updateData: Record<string, unknown> = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (classLevel !== undefined) updateData.classLevel = classLevel;
    if (address !== undefined) updateData.address = address;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // ✅ Handle parentInfo as nested object
    if (parentInfo) {
      updateData.parentInfo = {
        name: parentInfo.name,
        phone: parentInfo.phone,
        email: parentInfo.email || undefined,
      };
    }

    // ✅ Handle parentUser
    if (parentUserId !== undefined) {
      updateData.parentUser = parentUserId || null;
    }

    // ✅ Use findByIdAndUpdate with proper validation
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    ).lean().exec();

    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    
    // Better error handling
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
