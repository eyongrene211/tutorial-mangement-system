'use client';

import { useState, useEffect }                       from 'react';
import { DashboardLayout }                           from '@/components/layout/dashboard-layout';
import { IconPlus, IconSearch, IconEdit, IconTrash } from '@tabler/icons-react';
import { useUser }                                   from '@clerk/nextjs';
import { GradeModal }                                from '@/components/admin/grade-modal';
import toast                                         from 'react-hot-toast';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface Grade {
  _id: string;
  student: Student | string;
  subject: string;
  testName: string;
  testType: string;
  testDate: string;
  score: number;
  maxScore: number;
  percentage: number;
  term: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function TeacherGradesPage() {
  const { user } = useUser();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | undefined>(undefined);

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Teacher';

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grades');
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      } else {
        toast.error('Failed to load grades');
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      toast.error('Error loading grades');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = () => {
    setEditingGrade(undefined);
    setIsModalOpen(true);
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setIsModalOpen(true);
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Delete this grade? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/grades/${gradeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Grade deleted!');
        fetchGrades();
      } else {
        toast.error('Failed to delete grade');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error deleting grade');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGrade(undefined);
  };

  const handleSaveGrade = async () => {
    await fetchGrades();
    setIsModalOpen(false);
    setEditingGrade(undefined);
  };

  const filteredGrades = grades.filter((grade) => {
    const student = typeof grade.student === 'object' ? grade.student : null;
    const matchesSearch =
      (student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      grade.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || grade.subject === selectedSubject;
    const matchesClass = selectedClass === 'all' || student?.classLevel === selectedClass;
    return matchesSearch && matchesSubject && matchesClass;
  });

  const subjects = ['all', ...Array.from(new Set(grades.map((g) => g.subject)))];
  const classes = ['all', ...Array.from(new Set(grades.map((g) => {
    const student = typeof g.student === 'object' ? g.student : null;
    return student?.classLevel || '';
  }).filter(Boolean)))];

  // Calculate stats
  const totalGrades = filteredGrades.length;
  const averageScore = totalGrades > 0
    ? Math.round(filteredGrades.reduce((sum, g) => sum + g.percentage, 0) / totalGrades)
    : 0;
  const passCount = filteredGrades.filter(g => g.percentage >= 50).length;

  return (
    <DashboardLayout userName={fullName} role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Grades</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Record and manage test scores
            </p>
          </div>
          <button
            onClick={handleAddGrade}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <IconPlus className="w-5 h-5" />
            Add Grade
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Grades</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {totalGrades}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {averageScore}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
              {totalGrades > 0 ? Math.round((passCount / totalGrades) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search student, subject, or test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.filter(s => s !== 'all').map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.filter(c => c !== 'all').map((classLevel) => (
                <option key={classLevel} value={classLevel}>
                  {classLevel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600 mb-3"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading grades...</p>
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No grades found</p>
              <button
                onClick={handleAddGrade}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
                      Test
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredGrades.map((grade) => {
                    const student = typeof grade.student === 'object' ? grade.student : null;
                    return (
                      <tr key={grade._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student ? `${student.firstName} ${student.lastName}` : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {student?.classLevel}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {grade.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{grade.testName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{grade.testType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(grade.testDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {grade.score}/{grade.maxScore}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditGrade(grade)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit grade"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrade(grade._id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete grade"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <GradeModal
          grade={editingGrade}
          onClose={handleCloseModal}
          onSave={handleSaveGrade}
        />
      )}
    </DashboardLayout>
  );
}
