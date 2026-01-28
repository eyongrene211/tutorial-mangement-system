import { auth }                from '@clerk/nextjs/server';
import { redirect }            from 'next/navigation';
import connectDB               from '../../lib/mongodb';
import User                    from 'models/User';

export default async function HomePage() {
  const { userId } = await auth();

  // If not logged in, go to sign-in
  if (!userId) {
    redirect('/sign-in');
  }

  // If logged in, redirect based on role
  try {
    await connectDB();
    
    const user = await User.findOne({ clerkUserId: userId }).lean();

    if (!user) {
      // User not found in database, redirect to sign-in
      redirect('/sign-in');
    }

    // Redirect based on role (Admin, Teacher, Parent)
    switch (user.role) {
      case 'admin':
        redirect('/dashboard/admin');
      case 'teacher':
        redirect('/dashboard/teacher');
      case 'parent':
        redirect('/dashboard/parent');
      default:
        // Unknown role, redirect to sign-in
        redirect('/sign-in');
    }
  } catch (error) {
    console.error('❌ Error in HomePage:', error);
    // If database connection fails, redirect to sign-in
    redirect('/sign-in');
  }
}
