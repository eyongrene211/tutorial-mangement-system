import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../../lib/mongodb';
import User                          from '../../../../../models/User';


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateUserData {
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  address?: string;
  status?: string;
  subjects?: string[];
  students?: string[];
}

// GET single user
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const params = await context.params;
    const { id } = params;

    const user = await User.findById(id).populate('students', 'firstName lastName classLevel');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest, context: RouteParams) {
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
    const body = await request.json();
    const { firstName, lastName, role, subjects, students, phone, address, status } = body;

    const updateData: UpdateUserData = {
      firstName,
      lastName,
      role,
      phone,
      address,
      status,
    };

    // Only update subjects if role is tutor
    if (role === 'tutor') {
      updateData.subjects = subjects || [];
    } else {
      updateData.subjects = [];
    }

    // Only update students if role is parent
    if (role === 'parent') {
      updateData.students = students || [];
    } else {
      updateData.students = [];
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
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
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
