'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import { GradeModal }          from '@/components/admin/grade-modal';
import {
  IconPlus,
  IconFilter,
  IconTrendingUp,
  IconBook,
  IconChartBar,
  IconEdit,
  IconTrash,
  IconSchool,
  IconCalendar,
} from '@tabler/icons-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface Grade {
  _id: string;
  student: Student;
  subject: string;
  testName: string;
  testDate: string;
  score: number;
  maxScore: number;
  testType: string;
  recordedBy?: string;
  notes?: string;
  percentage: number;
}

interface Stats {
  totalGrades: number;
  totalStudents: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
  passingRate: number;
  subjectStats: Array<{
    subject: string;
    count: number;
    average: number;
    highest: number;
    lowest: number;
  }>;
}

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'French',
  'Biology',
  'History',
  'Geography',
];

const TEST_TYPES = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'exam', label: 'Exam' },
  { value: 'homework', label: 'Homework' },
  { value: 'assignment', label: 'Assignment' },
];

const CLASS_LEVELS = [
  'CM1',
  'CM2',
  'Form 1',
  'Form 2',
  'Form 3',
  'Form 4',
  'Form 5',
  'Lower Sixth',
  'Upper Sixth',
];

export default function GradesPage() {
  const { user: clerkUser } = useUser();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalGrades: 0,
    totalStudents: 0,
    averageScore: 0,
    averagePercentage: 0,
    highestScore: 0,
    lowestScore: 0,
    passingRate: 0,
    subjectStats: [],
  });

  const [filters, setFilters] = useState({
    subject: 'all',
    testType: 'all',
    classLevel: 'all',
    studentId: 'all',
    startDate: '',
    endDate: '',
  });

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin';

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?status=active');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch students');
      }

      const studentsArray = Array.isArray(data) ? data : data.students || [];
      setStudents(studentsArray);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      setStudents([]);
    }
  };

  // Fetch grades
  const fetchGrades = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.subject !== 'all') params.append('subject', filters.subject);
      if (filters.testType !== 'all') params.append('testType', filters.testType);
      if (filters.classLevel !== 'all') params.append('classLevel', filters.classLevel);
      if (filters.studentId !== 'all') params.append('studentId', filters.studentId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/grades?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch grades');
      }

      const gradesArray = Array.isArray(data) ? data : data.grades || [];
      setGrades(gradesArray);
      calculateStats(gradesArray);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
      setGrades([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats locally
  const calculateStats = (gradesData: Grade[]) => {
    const totalGrades = gradesData.length;

    if (totalGrades === 0) {
      setStats({
        totalGrades: 0,
        totalStudents: 0,
        averageScore: 0,
        averagePercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        passingRate: 0,
        subjectStats: [],
      });
      return;
    }

    const totalScore = gradesData.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
    const totalPercentage = gradesData.reduce((sum, g) => sum + (Number(g.percentage) || 0), 0);
    const averageScore = parseFloat((totalScore / totalGrades).toFixed(2));
    const averagePercentage = Math.round(totalPercentage / totalGrades);

    const percentages = gradesData.map((g) => g.percentage);
    const highestScore = Math.max(...percentages);
    const lowestScore = Math.min(...percentages);

    const passingGrades = gradesData.filter((g) => g.percentage >= 50).length;
    const passingRate = Math.round((passingGrades / totalGrades) * 100);

    const uniqueStudents = new Set(gradesData.map((g) => g.student?._id).filter(Boolean)).size;

    // Calculate subject stats
    const subjectMap = new Map<string, number[]>();
    gradesData.forEach((grade) => {
      if (!subjectMap.has(grade.subject)) {
        subjectMap.set(grade.subject, []);
      }
      subjectMap.get(grade.subject)!.push(grade.percentage);
    });

    const subjectStats = Array.from(subjectMap.entries()).map(([subject, percentages]) => ({
      subject,
      count: percentages.length,
      average: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
    }));

    setStats({
      totalGrades,
      totalStudents: uniqueStudents,
      averageScore,
      averagePercentage,
      highestScore,
      lowestScore,
      passingRate,
      subjectStats,
    });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [filters]);

  const handleAddGrade = (student?: Student) => {
    setSelectedStudent(student || null);
    setSelectedGrade(null);
    setShowModal(true);
  };

  const handleEditGrade = (grade: Grade) => {
    setSelectedStudent(grade.student);
    setSelectedGrade(grade);
    setShowModal(true);
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;

    try {
      const response = await fetch(`/api/grades/${gradeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete grade');
      }

      toast.success('Grade deleted successfully! ✅');
      fetchGrades();
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast.error('Failed to delete grade');
    }
  };

  const handleModalSave = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setSelectedGrade(null);
    fetchGrades();
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setSelectedGrade(null);
  };

  const getPercentageBadge = (percentage: number) => {
    if (percentage >= 90)
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    if (percentage >= 70)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (percentage >= 50)
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={loggedInUserName} role="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grades Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track and manage student academic performance
              </p>
            </div>
            <button
              onClick={() => handleAddGrade()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <IconPlus className="w-5 h-5" />
              <span>Add Grade</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Grades</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalGrades}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <IconBook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageScore}/20
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <IconTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average %</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averagePercentage}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <IconChartBar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.passingRate}%</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <IconSchool className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <IconFilter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Subjects</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Type
                </label>
                <select
                  value={filters.testType}
                  onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {TEST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Level
                </label>
                <select
                  value={filters.classLevel}
                  onChange={(e) => setFilters({ ...filters, classLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Classes</option>
                  {CLASS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student
                </label>
                <select
                  value={filters.studentId}
                  onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Students</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading grades...</p>
              </div>
            ) : grades.length === 0 ? (
              <div className="p-12 text-center">
                <IconBook className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No grades found</p>
                <button
                  onClick={() => handleAddGrade()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add First Grade
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Test Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {grades
                      .filter((grade) => grade && grade.student)
                      .map((grade) => (
                        <tr
                          key={grade._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {grade.student.firstName?.[0]}
                                {grade.student.lastName?.[0]}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {grade.student.firstName} {grade.student.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {grade.student.classLevel}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                              {grade.subject}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">{grade.testName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <IconCalendar className="w-4 h-4 mr-1" />
                              {new Date(grade.testDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize">
                              {grade.testType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {grade.score}/{grade.maxScore}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${getPercentageBadge(grade.percentage)}`}
                            >
                              {grade.percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditGrade(grade)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <IconEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGrade(grade._id)}
                                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <IconTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Subject Stats */}
          {stats.subjectStats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance by Subject
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.subjectStats.map((subjectStat) => (
                  <div
                    key={subjectStat.subject}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      {subjectStat.subject}
                    </h4>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <p>Tests: {subjectStat.count}</p>
                      <p>Average: {subjectStat.average}%</p>
                      <p>Highest: {subjectStat.highest}%</p>
                      <p>Lowest: {subjectStat.lowest}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <GradeModal
            student={selectedStudent || undefined}
            grade={selectedGrade || undefined}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />
        )}
      </DashboardLayout>
    </>
  );
}
