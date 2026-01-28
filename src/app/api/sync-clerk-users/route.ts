import { NextResponse }      from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import User                  from '../../../../models/User';    
import connectDB             from '../../../../lib/mongodb';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get current user from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // ✅ FIXED: Use clerkUserId instead of clerkId
    let dbUser = await User.findOne({ clerkUserId: userId });

    if (!dbUser) {
      // Create user in MongoDB
      const metadata = clerkUser.publicMetadata as Record<string, unknown>;
      const role = String(metadata.role || 'teacher');
      const studentId = metadata.studentId ? String(metadata.studentId) : null;

      // ✅ FIXED: Use correct field names
      dbUser = await User.create({
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || 'User',
        lastName: clerkUser.lastName || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        role: role,
        phone: '',
        status: 'active',
        studentId: studentId,
      });

      return NextResponse.json({
        success: true,
        message: '✅ User synced to MongoDB!',
        user: {
          email: dbUser.email,
          role: dbUser.role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User already exists in MongoDB',
      user: {
        email: dbUser.email,
        role: dbUser.role,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed';
    console.error('Sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
