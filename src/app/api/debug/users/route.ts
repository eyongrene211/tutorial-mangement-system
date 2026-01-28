import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import dbConnect        from 'lib/mongodb';
import User             from 'models/User';

export async function GET() {
  try {
    await dbConnect();
    
    const users = await User.find({}).lean();
    
    return NextResponse.json({
      total: users.length,
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        clerkUserId: u.clerkUserId,
        studentId: u.studentId,
      })),
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
