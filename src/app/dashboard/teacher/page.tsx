import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect }          from 'next/navigation';
import { DashboardLayout }   from '@/components/layout/dashboard-layout';
import dbConnect             from 'lib/mongodb';
import User                  from 'models/User';
import Student               from 'models/Student';
import Grade                 from 'models/Grade';
import Attendance            from 'models/Attendance';
import {
  IconUsers,
  IconBook,
  IconCalendarStats,
  IconChartBar,
  IconClipboardList,
  IconCalendarEvent,
} from '@tabler/icons-react';

interface StudentInfo {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface GradeWithStudent {
  _id: string;
  student: StudentInfo;
  subject: string;
  testName: string;
  score: number;
  maxScore: number;
  percentage: number;
  createdAt: Date;
}

interface TeacherStats {
  totalStudents: number;
  totalGrades: number;
  attendanceRate: number;
  presentToday: number;
  recentGrades: GradeWithStudent[];
}

async function getTeacherStats(): Promise<TeacherStats> {
  try {
    await dbConnect();

    const totalStudents = await Student.countDocuments({ status: 'active' });
    const totalGrades = await Grade.countDocuments({});
    
    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
    }).lean();

    const presentToday = todayAttendance.filter((a) => a.status === 'present').length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

    // Get recent grades
    const recentGradesRaw = await Grade.find({})
      .populate('student', 'firstName lastName classLevel')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentGrades = recentGradesRaw.map((grade) => ({
      _id: grade._id.toString(),
      student: grade.student as StudentInfo,
      subject: grade.subject,
      testName: grade.testName,
      score: grade.score,
      maxScore: grade.maxScore,
      percentage: grade.percentage,
      createdAt: grade.createdAt,
    }));

    return {
      totalStudents,
      totalGrades,
      attendanceRate,
      presentToday,
      recentGrades,
    };
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return {
      totalStudents: 0,
      totalGrades: 0,
      attendanceRate: 0,
      presentToday: 0,
      recentGrades: [],
    };
  }
}

export default async function TeacherDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/sign-in');
  }

  await dbConnect();

  let dbUser = await User.findOne({ clerkUserId: userId });

  if (!dbUser) {
    const metadata = clerkUser.publicMetadata || {};
    const role = typeof metadata.role === 'string' ? metadata.role : 'teacher';

    dbUser = await User.create({
      clerkUserId: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      firstName: clerkUser.firstName || 'Teacher',
      lastName: clerkUser.lastName || '',
      role: role,
      phone: '',
      status: 'active',
    });
  }

  if (dbUser.role !== 'teacher') {
    redirect('/dashboard');
  }

  const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Teacher';
  const firstName = clerkUser.firstName || 'Teacher';

  const stats = await getTeacherStats();

  return (
    <DashboardLayout userName={fullName} role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here&apos;s your teaching overview for today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <IconUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
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
                <IconCalendarStats className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              {stats.presentToday} of {stats.totalStudents} present
            </p>
          </div>

          {/* Total Grades */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Grades Recorded
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalGrades}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <IconBook className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/dashboard/teacher/attendance"
              className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-all transform hover:scale-105"
            >
              <div className="flex items-start space-x-3">
                <IconCalendarEvent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Take Attendance
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Mark today&apos;s attendance
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/dashboard/teacher/grades"
              className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-all transform hover:scale-105"
            >
              <div className="flex items-start space-x-3">
                <IconClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Add Grades
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Record student grades
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/dashboard/teacher/students"
              className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition-all transform hover:scale-105"
            >
              <div className="flex items-start space-x-3">
                <IconChartBar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="font-medium text-purple-900 dark:text-purple-100">
                    View Students
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    See student list
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Recent Grades */}
        {stats.recentGrades.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Grades
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Subject
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Test
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.recentGrades.map((grade) => (
                    <tr key={grade._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {grade.student?.firstName} {grade.student?.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {grade.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {grade.testName}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {grade.score}/{grade.maxScore} ({grade.percentage}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
