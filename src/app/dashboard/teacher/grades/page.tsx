'use client';

import { useState, useEffect }            from 'react';
import { DashboardLayout }                from '@/components/layout/dashboard-layout';
import { IconPlus, IconSearch, IconEdit } from '@tabler/icons-react';
import { useUser }                        from '@clerk/nextjs';
import { GradeModal }                     from '../../../../components/admin/grade-modal';


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
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error);
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
      grade.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || grade.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = ['all', ...Array.from(new Set(grades.map((g) => g.subject)))];

  return (
    <DashboardLayout userName={fullName} role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grades</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage student grades and test scores
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

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading grades...</p>
              </div>
            ) : filteredGrades.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No grades found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Student
                    </th>
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredGrades.map((grade) => {
                    const student = typeof grade.student === 'object' ? grade.student : null;
                    return (
                      <tr key={grade._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {student ? `${student.firstName} ${student.lastName}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {grade.subject}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {grade.testName}
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
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditGrade(grade)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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
