import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect }          from 'next/navigation';
import { DashboardLayout }   from '@/components/layout/dashboard-layout';
import connectDB             from 'lib/mongodb';
import dbConnect             from 'lib/mongodb';
import User                  from 'models/User';
export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/sign-in');
  }

  await connectDB();
  await dbConnect();

  let dbUser = await User.findOne({ clerkUserId: userId });

  // Auto-create user if doesn't exist
  if (!dbUser) {
    const metadata = (clerkUser.publicMetadata || {}) as Record<string, unknown>;
    const role = String(metadata.role || 'teacher');

    try {
      dbUser = await User.create({
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || 'User',
        lastName: clerkUser.lastName || '',
        role: role,
        phone: '',
        status: 'active',
      });
      console.log('✅ Created new user:', dbUser);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      
      // Try to find by email in case of race condition
      const userEmail = clerkUser.emailAddresses[0].emailAddress;
      dbUser = await User.findOne({ email: userEmail });
      
      if (!dbUser) {
        // Last resort - try clerkUserId again
        dbUser = await User.findOne({ clerkUserId: userId });
      }
      
      if (!dbUser) {
        throw error;
      }
    }
  }

  // Construct full name for display
  const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';

  // Redirect based on role
  if (dbUser.role === 'admin') {
    redirect('/dashboard/admin');
  } else if (dbUser.role === 'teacher') {
    redirect('/dashboard/teacher');
  } else if (dbUser.role === 'parent') {
    redirect('/dashboard/parent');
  }

  // Default dashboard for unknown roles
  return (
    <DashboardLayout userName={fullName} role={dbUser.role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {clerkUser.firstName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your dashboard is loading...
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
