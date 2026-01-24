'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import { StudentModal }        from '@/components/admin/student-modal';
import {
  IconPlus,
  IconFilter,
  IconUsers,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUserX,
  IconPhone,
  IconMail,
} from '@tabler/icons-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  classLevel: string;
  parentUser?: string;
  parentInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  address?: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  byClass: Array<{
    classLevel: string;
    count: number;
  }>;
}

const CLASS_LEVELS = [
  'Form 1',
  'Form 2',
  'Form 3',
  'Form 4',
  'Form 5',
  'Lower Sixth',
  'Upper Sixth',
];

export default function StudentsPage() {
  const { user: clerkUser } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    byClass: [],
  });

  const [filters, setFilters] = useState({
    status: 'all',
    classLevel: 'all',
    search: '',
  });

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin';

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.classLevel !== 'all') params.append('classLevel', filters.classLevel);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/students?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch students');
      }

      const studentsArray = Array.isArray(data) ? data : data.students || [];
      setStudents(studentsArray);
      calculateStats(studentsArray);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      setStudents([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (studentsData: Student[]) => {
    const total = studentsData.length;
    const active = studentsData.filter((s) => s.status === 'active').length;
    const inactive = studentsData.filter((s) => s.status === 'inactive').length;

    const classMap = new Map<string, number>();
    studentsData.forEach((student) => {
      const count = classMap.get(student.classLevel) || 0;
      classMap.set(student.classLevel, count + 1);
    });

    const byClass = Array.from(classMap.entries())
      .map(([classLevel, count]) => ({ classLevel, count }))
      .sort((a, b) => {
        const order = CLASS_LEVELS.indexOf(a.classLevel) - CLASS_LEVELS.indexOf(b.classLevel);
        return order !== 0 ? order : b.count - a.count;
      });

    setStats({ total, active, inactive, byClass });
  };

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setShowModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.'))
      return;

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      toast.success('Student deleted successfully! ✅');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleModalSave = () => {
    setShowModal(false);
    setSelectedStudent(null);
    fetchStudents();
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={loggedInUserName} role="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Students Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage student records and tutorial enrollment
              </p>
            </div>
            <button
              onClick={handleAddStudent}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <IconPlus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <IconUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <IconUserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <IconUserX className="w-6 h-6 text-gray-600 dark:text-gray-400" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center">
                <IconUsers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No students found</p>
                <button
                  onClick={handleAddStudent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add First Student
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
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Age/Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Parent Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {student._id.slice(-6)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                            {student.classLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {calculateAge(student.dateOfBirth)} years
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {student.gender}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.parentInfo.name}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <IconPhone className="w-3 h-3" />
                            <span>{student.parentInfo.phone}</span>
                          </div>
                          {student.parentInfo.email && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <IconMail className="w-3 h-3" />
                              <span>{student.parentInfo.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(student.status)}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student._id)}
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

          {/* Class Distribution */}
          {stats.byClass.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Students by Class
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {stats.byClass.map((item) => (
                  <div
                    key={item.classLevel}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {item.classLevel}
                    </h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {item.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <StudentModal student={selectedStudent} onClose={handleModalClose} onSave={handleModalSave} />
        )}
      </DashboardLayout>
    </>
  );
}
