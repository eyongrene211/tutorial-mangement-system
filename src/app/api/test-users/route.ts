import { NextResponse } from 'next/server';
import connectDB        from '../../../../lib/mongodb';
import User             from '../../../../models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      count: users.length,
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        clerkId: u.clerkId,
        studentId: u.studentId,
        createdAt: u.createdAt,
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
