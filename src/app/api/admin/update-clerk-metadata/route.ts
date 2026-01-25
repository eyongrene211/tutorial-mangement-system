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

    const { clerkUserId, metadata } = await request.json();

    if (!clerkUserId || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update Clerk user metadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: metadata,
    });

    console.log(`✅ Updated Clerk metadata for user: ${clerkUserId}`);

    return NextResponse.json({
      success: true,
      message: 'Metadata updated successfully',
    });
  } catch (error) {
    console.error('❌ Failed to update Clerk metadata:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
