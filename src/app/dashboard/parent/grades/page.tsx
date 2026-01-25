import { auth, currentUser }                  from '@clerk/nextjs/server';
import { redirect }                           from 'next/navigation';
import { DashboardLayout }                    from '@/components/layout/dashboard-layout';
import dbConnect                              from 'lib/mongodb';
import User                                   from 'models/User';
import Student                                from 'models/Student';
import Grade                                  from 'models/Grade';
import { IconTrophy, IconBook, IconChartBar } from '@tabler/icons-react';

interface GradeData {
  _id: string;
  subject: string;
  testName: string;
  testType: string;
  testDate: Date;
  score: number;
  maxScore: number;
  percentage: number;
  term: string;
  remarks?: string;
}

async function getStudentGrades(studentId: string) {
  try {
    await dbConnect();

    const student = await Student.findById(studentId).lean();
    if (!student) return null;

    const grades = await Grade.find({ student: studentId })
      .sort({ testDate: -1 })
      .lean();

    // Calculate stats by subject
    const subjectStats = new Map();
    grades.forEach((grade) => {
      if (!subjectStats.has(grade.subject)) {
        subjectStats.set(grade.subject, { total: 0, count: 0, grades: [] });
      }
      const stats = subjectStats.get(grade.subject);
      stats.total += grade.percentage;
      stats.count += 1;
      stats.grades.push(grade);
    });

    const subjectAverages = Array.from(subjectStats.entries()).map(([subject, stats]) => ({
      subject,
      average: Math.round(stats.total / stats.count),
      count: stats.count,
    }));

    const overallAverage =
      grades.length > 0
        ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length)
        : 0;

    return {
      student,
      grades,
      subjectAverages,
      overallAverage,
    };
  } catch (error) {
    console.error('Error fetching grades:', error);
    return null;
  }
}

export default async function ParentGradesPage() {
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

  const data = await getStudentGrades(dbUser.studentId.toString());

  if (!data) {
    return (
      <DashboardLayout userName={fullName} role="parent">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-900 dark:text-red-100">
            Unable to load student data. Please try again later.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { student, grades, subjectAverages, overallAverage } = data;

  return (
    <DashboardLayout userName={fullName} role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {student.firstName}&apos;s Grades
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Academic performance overview
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Average
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {overallAverage}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <IconTrophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tests
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {grades.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <IconBook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Subjects
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {subjectAverages.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <IconChartBar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Subject Averages */}
        {subjectAverages.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance by Subject
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectAverages.map((subj) => (
                <div
                  key={subj.subject}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {subj.subject}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {subj.average}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      ({subj.count} tests)
                    </p>
                  </div>
                  <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        subj.average >= 70
                          ? 'bg-green-600'
                          : subj.average >= 50
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${subj.average}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Grades */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Grades
            </h2>
          </div>
          <div className="overflow-x-auto">
            {grades.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No grades recorded yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Test
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {grades.map((grade: GradeData) => (
                    <tr key={grade._id.toString()} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(grade.testDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {grade.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {grade.testName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {grade.testType}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
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
