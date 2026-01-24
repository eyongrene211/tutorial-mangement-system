import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser }         from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import User                          from 'models/User';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the requesting user in database
    const requestingUser = await User.findOne({ clerkUserId: userId });
    
    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Check if user is admin
    if (requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    // Fetch all users
    const users = await User.find({})
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find the requesting user
    const requestingUser = await User.findOne({ clerkUserId: userId });
    
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const body = await request.json();
    const { clerkUserId, email, firstName, lastName, role, phone, status } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = await User.create({
      clerkUserId: clerkUserId || null,
      email,
      firstName,
      lastName,
      role: role || 'teacher',
      phone: phone || '',
      status: status || 'active',
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
