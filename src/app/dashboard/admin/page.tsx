import { auth, currentUser }   from '@clerk/nextjs/server';
import { redirect }            from 'next/navigation';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import { QuickActionsSection } from '@/components/admin/quick-actions';
import dbConnect               from 'lib/mongodb';
import User                    from 'models/User';
import Student                 from 'models/Student';
import Attendance              from 'models/Attendance';
import Grade                   from 'models/Grade';
import connectDB               from 'lib/mongodb';

async function getDashboardStats() {
  try {
    await dbConnect();

    // Get total students
    const totalStudents = await Student.countDocuments({ status: 'active' });
    const lastMonthStudents = await Student.countDocuments({
      status: 'active',
      createdAt: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    });

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    }).lean();

    const presentToday = todayAttendance.filter((a) => a.status === 'present').length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

    // Get average grade
    const grades = await Grade.find({}).lean();
    const averageScore =
      grades.length > 0
        ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(1)
        : '0.0';
    const averageMaxScore =
      grades.length > 0 ? grades.reduce((sum, g) => sum + g.maxScore, 0) / grades.length : 20;

    // Calculate previous month average for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthGrades = await Grade.find({
      testDate: { $lt: lastMonth },
    }).lean();
    const lastMonthAverage =
      lastMonthGrades.length > 0
        ? lastMonthGrades.reduce((sum, g) => sum + g.score, 0) / lastMonthGrades.length
        : 0;
    const gradeImprovement = parseFloat(averageScore) - lastMonthAverage;

    // Mock revenue (replace with actual payment system when implemented)
    const monthlyRevenue = totalStudents * 25000; // 25,000 FCFA per student
    const lastMonthRevenue = lastMonthStudents * 25000;
    const revenueGrowth =
      lastMonthRevenue > 0
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

    return {
      totalStudents,
      lastMonthStudents,
      attendanceRate,
      presentToday,
      monthlyRevenue,
      revenueGrowth,
      averageScore,
      averageMaxScore,
      gradeImprovement,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalStudents: 0,
      lastMonthStudents: 0,
      attendanceRate: 0,
      presentToday: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      averageScore: '0.0',
      averageMaxScore: 20,
      gradeImprovement: 0,
    };
  }
}

export default async function AdminDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/sign-in');
  }

  await connectDB();
  let dbUser = await User.findOne({ clerkUserId: userId });

  // Auto-create user if doesn't exist
  if (!dbUser) {
    const metadata = (clerkUser.publicMetadata || {}) as Record<string, unknown>;
    const role = String(metadata.role || 'teacher');

    dbUser = await User.create({
      clerkUserId: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      firstName: clerkUser.firstName || 'User',
      lastName: clerkUser.lastName || '',
      role: role,
      phone: '',
      status: 'active',
    });
  }

  // Check if user is actually admin
  if (dbUser.role !== 'admin') {
    redirect('/dashboard');
  }

  // Construct full name for display
  const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin';
  const firstName = clerkUser.firstName || 'Admin';

  // Fetch dashboard statistics
  const stats = await getDashboardStats();

  return (
    <DashboardLayout userName={fullName} role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here&apos;s what&apos;s happening with your tutorial center today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Students */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.lastMonthStudents > 0 ? (
                <>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +{stats.lastMonthStudents}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">from last month</span>
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">All active students</span>
              )}
            </div>
          </div>

          {/* Today's Attendance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today&apos;s Attendance
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.attendanceRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {stats.presentToday} of {stats.totalStudents} students present
              </span>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {(stats.monthlyRevenue / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.revenueGrowth !== 0 ? (
                <>
                  <span
                    className={`font-medium ${
                      stats.revenueGrowth > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {stats.revenueGrowth > 0 ? '+' : ''}
                    {stats.revenueGrowth}%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">from last month</span>
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">Projected revenue</span>
              )}
            </div>
          </div>

          {/* Average Grade */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Grade
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.averageScore}/{stats.averageMaxScore}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.gradeImprovement !== 0 ? (
                <>
                  <span
                    className={`font-medium ${
                      stats.gradeImprovement > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {stats.gradeImprovement > 0 ? '+' : ''}
                    {stats.gradeImprovement.toFixed(1)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">from last month</span>
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">Overall average</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Client Component */}
        <QuickActionsSection />
      </div>
    </DashboardLayout>
  );
}
