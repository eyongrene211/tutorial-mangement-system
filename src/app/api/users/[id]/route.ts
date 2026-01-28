import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import User                          from 'models/User';
import connectDB                     from 'lib/mongodb';

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

    const resolvedParams = await params;
    const user = await User.findById(resolvedParams.id).select('-__v');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check if requesting user is admin
    const requestingUser = await User.findOne({ clerkUserId: userId });
    
    console.log('🔍 Requesting user:', requestingUser?.email, 'Role:', requestingUser?.role);
    
    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    if (requestingUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admins only.',
        userRole: requestingUser.role 
      }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, role, phone, status, studentId } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: resolvedParams.id } 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use by another user' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      resolvedParams.id,
      {
        email,
        firstName,
        lastName,
        role: role || 'teacher',
        phone: phone || '',
        status: status || 'active',
        studentId: studentId || null,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ Updated user:', updatedUser.email, 'StudentID:', updatedUser.studentId);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check if requesting user is admin
    const requestingUser = await User.findOne({ clerkUserId: userId });
    
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const deletedUser = await User.findByIdAndDelete(resolvedParams.id);

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ Deleted user:', deletedUser.email);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
