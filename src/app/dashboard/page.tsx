import { auth }     from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import dbConnect    from 'lib/mongodb';
import User         from 'models/User';
import Link         from 'next/link';

export default async function DashboardRouter() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  await dbConnect();
  const user = await User.findOne({ clerkUserId: userId }).lean();

  if (!user) {
    redirect('/sign-in');
  }

  // Redirect based on role
  switch (user.role) {
    case 'admin':
      redirect('/dashboard/admin');
    case 'teacher':
      redirect('/dashboard/teacher');
    case 'parent':
      redirect('/dashboard/parent');
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Account Setup Pending</h1>
            <p className="text-gray-600 mb-6">
              Your tutorial account is being configured. Please contact your administrator for access.
            </p>
            <Link
              href="/sign-in"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      );
  }
}
