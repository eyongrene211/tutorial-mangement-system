import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient }         from '@clerk/nextjs/server';
import dbConnect                     from '@/lib/mongodb';
import User                          from '@/models/User';
import mongoose                      from 'mongoose';
import type { User as ClerkUser }    from '@clerk/nextjs/server';

interface SyncResult {
  matched: number;
  updated: number;
  failed: number;
  details: Array<{
    email: string;
    status: 'linked' | 'no_clerk_account' | 'error';
    clerkId?: string;
    mongoId: string | mongoose.Types.ObjectId;
    error?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const requestingUser = await User.findOne({ clerkUserId: userId });
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const usersWithoutClerk = await User.find({ clerkUserId: null });
    
    // Initialize the Clerk client once
    const clerk = await clerkClient();

    const results: SyncResult = {
      matched: 0,
      updated: 0,
      failed: 0,
      details: []
    };

    for (const dbUser of usersWithoutClerk) {
      try {
        const clerkUsers = await clerk.users.getUserList({
          emailAddress: [dbUser.email]
        });

        if (clerkUsers.data.length > 0) {
          const clerkUser: ClerkUser = clerkUsers.data[0];
          
          await User.findByIdAndUpdate(dbUser._id, {
            clerkUserId: clerkUser.id
          });

          await clerk.users.updateUser(clerkUser.id, {
            publicMetadata: {
              role: dbUser.role,
              dbId: dbUser._id.toString()
            }
          });

          results.matched++;
          results.updated++;
          results.details.push({
            email: dbUser.email,
            status: 'linked',
            clerkId: clerkUser.id,
            mongoId: dbUser._id
          });
        } else {
          results.details.push({
            email: dbUser.email,
            status: 'no_clerk_account',
            mongoId: dbUser._id
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.failed++;
        results.details.push({
          email: dbUser.email,
          status: 'error',
          mongoId: dbUser._id,
          error: message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.updated} users`,
      ...results
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}