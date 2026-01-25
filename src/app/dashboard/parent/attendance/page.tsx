import { auth, currentUser }                                               from '@clerk/nextjs/server';
import { redirect }                                                        from 'next/navigation';
import { DashboardLayout }                                                 from '@/components/layout/dashboard-layout';
import dbConnect                                                           from 'lib/mongodb';
import User                                                                from 'models/User';
import Student                                                             from 'models/Student';
import Attendance                                                          from 'models/Attendance';
import { IconCalendarStats, IconCheck, IconX, IconClock, IconAlertCircle } from '@tabler/icons-react';

interface AttendanceRecord {
  _id: string;
  date: Date;
  status: string;
  remarks?: string;
}

async function getStudentAttendance(studentId: string) {
  try {
    await dbConnect();

    const student = await Student.findById(studentId).lean();
    if (!student) return null;

    // Get last 60 days of attendance
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const attendance = await Attendance.find({
      student: studentId,
      date: { $gte: sixtyDaysAgo },
    })
      .sort({ date: -1 })
      .lean();

    // Calculate stats
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const late = attendance.filter((a) => a.status === 'late').length;
    const excused = attendance.filter((a) => a.status === 'excused').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      student,
      attendance,
      stats: { total, present, absent, late, excused, rate },
    };
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return null;
  }
}

export default async function ParentAttendancePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  await dbConnect();

  const dbUser = await User.findOne({ clerkUserId: userId });
  if (!dbUser || dbUser.role !== 'parent') {
    redirect('/dashboard');
  }

  const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Parent';

  if (!dbUser.studentId) {
    return (
      <DashboardLayout userName={fullName} role="parent">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-yellow-900 dark:text-yellow-100">
            No student linked to your account. Please contact the administrator.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const data = await getStudentAttendance(dbUser.studentId.toString());

  if (!data) {
    return (
      <DashboardLayout userName={fullName} role="parent">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-900 dark:text-red-100">
            Unable to load attendance data. Please try again later.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { student, attendance, stats } = data;

  return (
    <DashboardLayout userName={fullName} role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {student.firstName}&apos;s Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Attendance record for the last 60 days
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconCalendarStats className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rate</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rate}%</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Present</p>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.present}</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconX className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Absent</p>
            </div>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.absent}</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Late</p>
            </div>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.late}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Excused</p>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.excused}</p>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attendance History
            </h2>
          </div>
          <div className="overflow-x-auto">
            {attendance.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No attendance records found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Day
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {attendance.map((record: AttendanceRecord) => (
                    <tr key={record._id.toString()} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === 'present'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : record.status === 'late'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : record.status === 'excused'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
