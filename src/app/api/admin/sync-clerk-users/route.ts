import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient }         from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import User                          from 'models/User';

export async function POST(request: NextRequest) {
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

    // Get all Clerk users
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 100 });

    let synced = 0;
    let skipped = 0;

    for (const clerkUser of clerkUsers.data) {
      // Check if user already exists in MongoDB
      const existingUser = await User.findOne({ clerkUserId: clerkUser.id });

      if (!existingUser) {
        // Get metadata
        const metadata = clerkUser.publicMetadata || {};
        const role = typeof metadata.role === 'string' ? metadata.role : 'teacher';
        const studentId = typeof metadata.studentId === 'string' ? metadata.studentId : null;

        // Create user in MongoDB
        await User.create({
          clerkUserId: clerkUser.id,
          email: clerkUser.emailAddresses[0].emailAddress,
          firstName: clerkUser.firstName || 'User',
          lastName: clerkUser.lastName || '',
          role: role,
          phone: '',
          status: 'active',
          studentId: studentId,
        });

        synced++;
        console.log(`✅ Synced user: ${clerkUser.emailAddresses[0].emailAddress}`);
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} users, skipped ${skipped} existing users`,
      synced,
      skipped,
    });
  } catch (error) {
    console.error('❌ Failed to sync users:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
