import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect }          from 'next/navigation';
import { DashboardLayout }   from '@/components/layout/dashboard-layout';
import dbConnect             from 'lib/mongodb';
import User                  from 'models/User';
import Student               from 'models/Student';
import Grade                 from 'models/Grade';
import Attendance            from 'models/Attendance';
import Payment               from 'models/Payment';
import {
  IconUser,
  IconBook,
  IconCalendarStats,
  IconTrophy,
  IconAlertCircle,
  IconCash,
  IconReceipt,
} from '@tabler/icons-react';

interface StudentData {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
  dateOfBirth: Date;
  gender: string;
  status: string;
}

interface GradeData {
  _id: string;
  subject: string;
  testName: string;
  score: number;
  maxScore: number;
  percentage: number;
  testDate: Date;
  remarks?: string;
}

interface AttendanceData {
  _id: string;
  date: Date;
  status: string;
}

interface PaymentData {
  _id: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  currency: string;
}

async function getStudentData(studentId: string, parentId: string) {
  try {
    await dbConnect();

    const student = await Student.findById(studentId).lean();
    if (!student) {
      console.log('❌ Student not found:', studentId);
      return null;
    }

    console.log('✅ Found student:', student.firstName, student.lastName);

    // Get recent grades
    const grades = await Grade.find({ student: studentId })
      .sort({ testDate: -1 })
      .limit(10)
      .lean();

    console.log('✅ Found grades:', grades.length);

    // Get attendance for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await Attendance.find({
      student: studentId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: -1 })
      .lean();

    console.log('✅ Found attendance records:', attendance.length);

    // ✅ Get recent payments (last 3 months)
    const payments = await Payment.find({ parentId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    console.log('✅ Found payments:', payments.length);

    // Calculate total outstanding balance
    const totalOutstanding = payments.reduce((sum, p) => sum + (p.balance || 0), 0);

    // Calculate stats
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    const averageGrade =
      grades.length > 0
        ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length)
        : 0;

    return {
      student,
      grades,
      attendance,
      payments,
      stats: {
        attendanceRate,
        averageGrade,
        totalGrades: grades.length,
        totalAttendance,
        presentCount,
        totalOutstanding,
      },
    };
  } catch (error) {
    console.error('❌ Error fetching student data:', error);
    return null;
  }
}

export default async function ParentDashboardPage() {
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
    const role = typeof metadata.role === 'string' ? metadata.role : 'parent';
    const studentId = typeof metadata.studentId === 'string' ? metadata.studentId : null;

    dbUser = await User.create({
      clerkUserId: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      firstName: clerkUser.firstName || 'Parent',
      lastName: clerkUser.lastName || '',
      role: role,
      phone: '',
      status: 'active',
      studentId: studentId,
    });
  }

  if (dbUser.role !== 'parent') {
    redirect('/dashboard');
  }

  const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Parent';
  const firstName = clerkUser.firstName || 'Parent';

  // Get student data if studentId exists
  let studentData = null;
  if (dbUser.studentId) {
    console.log('🔍 Fetching data for student ID:', dbUser.studentId.toString());
    console.log('🔍 Parent ID:', dbUser._id.toString());
    studentData = await getStudentData(dbUser.studentId.toString(), dbUser._id.toString());
  }

  // No student linked - show message
  if (!studentData) {
    return (
      <DashboardLayout userName={fullName} role="parent">
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <IconAlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  No Student Linked
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Your account is not linked to any student. Please contact the administrator
                  to link your account to your child&apos;s profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { student, grades, attendance, payments, stats } = studentData;

  return (
    <DashboardLayout userName={fullName} role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here&apos;s your child&apos;s academic overview
          </p>
        </div>

        {/* Student Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <IconUser className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-blue-100 mt-1">Class: {student.classLevel}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Attendance Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.attendanceRate}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats.presentCount} of {stats.totalAttendance} days
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <IconCalendarStats className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Average Grade */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Grade
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.averageGrade}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats.totalGrades} tests
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <IconTrophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Total Grades */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recorded Grades
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalGrades}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All subjects</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <IconBook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Outstanding
                </p>
                <p className={`text-3xl font-bold mt-2 ${stats.totalOutstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {stats.totalOutstanding.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">FCFA</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.totalOutstanding > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                <IconCash className={`w-6 h-6 ${stats.totalOutstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        {payments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Payments
              </h2>
              <a
                href="/dashboard/parent/payments"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                View all →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {payments.map((payment: PaymentData) => (
                <div
                  key={payment._id.toString()}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {payment.month}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                      payment.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : payment.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {payment.totalAmount.toLocaleString()} {payment.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {payment.amountPaid.toLocaleString()} {payment.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                      <span className={`font-bold ${payment.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {payment.balance.toLocaleString()} {payment.currency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Attendance */}
        {attendance.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Attendance (Last 10 Days)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {attendance.slice(0, 10).map((record: AttendanceData) => (
                <div
                  key={record._id.toString()}
                  className={`p-3 rounded-lg text-center border ${
                    record.status === 'present'
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                      : record.status === 'late'
                      ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                      : record.status === 'excused'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                      : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                  }`}
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {new Date(record.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs font-semibold mt-1 capitalize">
                    {record.status === 'present' ? '✓' : record.status === 'absent' ? '✗' : record.status}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <a
                href="/dashboard/parent/attendance"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                View full attendance history →
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <p className="text-blue-800 dark:text-blue-200 text-center">
              No attendance records found for the last 30 days
            </p>
          </div>
        )}

        {/* Recent Grades */}
        {grades.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Grades
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Test
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Percentage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {grades.map((grade: GradeData) => (
                    <tr
                      key={grade._id.toString()}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {grade.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {grade.testName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {grade.score}/{grade.maxScore}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            grade.percentage >= 70
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : grade.percentage >= 50
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {grade.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {grade.remarks || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(grade.testDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <a
                href="/dashboard/parent/grades"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                View all grades →
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <p className="text-blue-800 dark:text-blue-200 text-center">
              No grades recorded yet
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}