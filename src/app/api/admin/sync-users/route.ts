import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient }         from '@clerk/nextjs/server';
import dbConnect                     from '@/lib/mongodb';
import User                          from '@/models/User';
import type { 
  User as ClerkUser, 
  UserList as ClerkUserList 
} from '@clerk/nextjs/server';
import type { ObjectId }             from 'mongoose';

// ✅ Proper types for results
interface SyncResultDetail {
  email: string;
  status: 'linked' | 'no_clerk_account' | 'error';
  clerkId?: string;
  mongoId: string | ObjectId;
  error?: string;
}

interface SyncResult {
  matched: number;
  updated: number;
  failed: number;
  details: SyncResultDetail[];
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
    console.log(`🔍 Found ${usersWithoutClerk.length} users without Clerk IDs`);

    const results: SyncResult = {
      matched: 0,
      updated: 0,
      failed: 0,
      details: []
    };

    // ✅ FIXED: Await clerkClient()
    const clerk = await clerkClient();

    for (const dbUser of usersWithoutClerk) {
      try {
        console.log(`Checking Clerk for: ${dbUser.email}`);
        
        // ✅ FIXED: Proper Clerk types
        const clerkUsers: ClerkUserList = await clerk.users.getUserList({
          emailAddress: [dbUser.email]
        });

        if (clerkUsers.data.length > 0) {
          const clerkUser: ClerkUser = clerkUsers.data[0];
          console.log(`✅ Found Clerk user for ${dbUser.email}: ${clerkUser.id}`);
          
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
            status: 'linked' as const,
            clerkId: clerkUser.id,
            mongoId: dbUser._id
          });
        } else {
          console.log(`⚠️ No Clerk user found for ${dbUser.email}`);
          results.details.push({
            email: dbUser.email,
            status: 'no_clerk_account' as const,
            mongoId: dbUser._id
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error processing ${dbUser.email}:`, errorMessage);
        results.failed++;
        results.details.push({
          email: dbUser.email,
          status: 'error' as const,
          mongoId: dbUser._id,
          error: errorMessage
        });
      }
    }

    console.log('Sync complete:', results);

    return NextResponse.json({
      success: true,
      message: `Synced ${results.updated} users`,
      ...results
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed';
    console.error('Sync error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
