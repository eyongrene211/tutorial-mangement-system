'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import {
  IconCalendar,
  IconCheck,
  IconX,
  IconClock,
  IconFileText,
} from '@tabler/icons-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
  gender: string;
  status: string;
  subjects: string[];
}

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    classLevel: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject: string;
  remarks?: string;
}

interface StudentAttendance extends Student {
  attendanceStatus?: 'present' | 'absent' | 'late' | 'excused';
  attendanceRemarks?: string;
  attendanceId?: string;
  attendanceSubject?: string;
}

export default function AttendancePage() {
  const { user: clerkUser } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0,
  });

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin';

  const classLevels = [
    'CM1', 'CM2',
    'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5',
    'Lower Sixth', 'Upper Sixth'
  ];

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/settings/subjects');
        if (response.ok) {
          const data = await response.json();
          setSubjects(data.subjects || ['Mathematics', 'Physics', 'Chemistry', 'English', 'French']);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjects(['Mathematics', 'Physics', 'Chemistry', 'English', 'French']);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch students and their attendance for selected date
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students for selected class
      const studentsParams = new URLSearchParams();
      if (selectedClass !== 'all') {
        studentsParams.append('classLevel', selectedClass);
      }
      studentsParams.append('status', 'active');

      const studentsResponse = await fetch(`/api/students?${studentsParams.toString()}`);
      
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }

      const studentsData = await studentsResponse.json();

      // Fetch attendance records for selected date and subject
      const attendanceParams = new URLSearchParams();
      attendanceParams.append('date', selectedDate);
      attendanceParams.append('subject', selectedSubject);
      if (selectedClass !== 'all') {
        // Filter will be done client-side
      }

      const attendanceResponse = await fetch(`/api/attendance?${attendanceParams.toString()}`);
      
      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance');
      }

      const attendanceData = await attendanceResponse.json();

      // Merge students with their attendance records
      const attendanceMap = new Map<string, AttendanceRecord>();
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach((record: AttendanceRecord) => {
          if (record.student && record.student._id) {
            attendanceMap.set(record.student._id, record);
          }
        });
      }

      const mergedData: StudentAttendance[] = (Array.isArray(studentsData) ? studentsData : []).map((student: Student) => {
        const attendance = attendanceMap.get(student._id);
        return {
          ...student,
          attendanceStatus: attendance?.status,
          attendanceRemarks: attendance?.remarks,
          attendanceId: attendance?._id,
          attendanceSubject: attendance?.subject,
        };
      });

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setStudentAttendance(mergedData);

      // Calculate stats
      const marked = mergedData.filter(s => s.attendanceStatus);
      const presentCount = marked.filter(s => s.attendanceStatus === 'present').length;
      const absentCount = marked.filter(s => s.attendanceStatus === 'absent').length;
      const lateCount = marked.filter(s => s.attendanceStatus === 'late').length;
      const excusedCount = marked.filter(s => s.attendanceStatus === 'excused').length;
      const rate = marked.length > 0 ? ((presentCount + lateCount) / marked.length) * 100 : 0;

      setStats({
        totalRecords: marked.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendanceRate: Math.round(rate * 10) / 10,
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load attendance data');
      setStudents([]);
      setStudentAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjects.length > 0) {
      fetchData();
    }
  }, [selectedDate, selectedClass, selectedSubject, subjects.length]);

  // Quick mark attendance
  const quickMark = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    try {
      const student = studentAttendance.find(s => s._id === studentId);
      if (!student) return;

      // Check if attendance already exists
      if (student.attendanceId) {
        // Update existing
        const response = await fetch(`/api/attendance/${student.attendanceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update attendance');
        }
      } else {
        // Create new
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            date: selectedDate,
            status,
            subject: selectedSubject,
            remarks: '',
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to mark attendance');
        }

        const data = await response.json();

        // Update local state with new attendance ID
        setStudentAttendance(prev =>
          prev.map(s =>
            s._id === studentId
              ? { ...s, attendanceStatus: status, attendanceId: data._id }
              : s
          )
        );
      }

      toast.success('Attendance marked! ✅');
      fetchData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark attendance';
      toast.error(errorMessage);
    }
  };

  // Mark all present
  const markAllPresent = async () => {
    if (studentAttendance.length === 0) {
      toast.error('No students to mark');
      return;
    }

    const confirmed = window.confirm(
      `Mark all ${studentAttendance.length} students as Present for ${new Date(selectedDate).toLocaleDateString()} - ${selectedSubject}?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      let successCount = 0;

      for (const student of studentAttendance) {
        try {
          if (student.attendanceId) {
            await fetch(`/api/attendance/${student.attendanceId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'present' }),
            });
          } else {
            await fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId: student._id,
                date: selectedDate,
                status: 'present',
                subject: selectedSubject,
                remarks: '',
              }),
            });
          }
          successCount++;
        } catch (error) {
          console.error(`Failed to mark ${student.firstName}:`, error);
        }
      }

      toast.success(`All students marked present! ✅ (${successCount} successful)`);
      fetchData();
    } catch (error) {
      console.error('Error marking all present:', error);
      toast.error('Failed to mark all present');
    } finally {
      setSaving(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status?: 'present' | 'absent' | 'late' | 'excused') => {
    if (!status) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          Not Marked
        </span>
      );
    }

    const badges = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      excused: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    };

    const labels = {
      present: '✅ Present',
      absent: '❌ Absent',
      late: '⏰ Late',
      excused: '📝 Excused',
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
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
                Attendance Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Mark and track student attendance for tutorial sessions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={markAllPresent}
                disabled={saving || studentAttendance.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconCheck className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Mark All Present'}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {studentAttendance.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <IconFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.present}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <IconCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.absent}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <IconX className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.late}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <IconClock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.attendanceRate}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Date
                </label>
                <div className="relative">
                  <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Classes</option>
                  {classLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading students...</p>
              </div>
            ) : studentAttendance.length === 0 ? (
              <div className="p-12 text-center">
                <IconFileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No students found for {selectedClass === 'all' ? 'any class' : selectedClass}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quick Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {studentAttendance.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {student.gender}
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
                          {getStatusBadge(student.attendanceStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => quickMark(student._id, 'present')}
                              className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                              title="Mark Present"
                            >
                              <IconCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => quickMark(student._id, 'absent')}
                              className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                              title="Mark Absent"
                            >
                              <IconX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => quickMark(student._id, 'late')}
                              className="p-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-lg transition-colors"
                              title="Mark Late"
                            >
                              <IconClock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => quickMark(student._id, 'excused')}
                              className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                              title="Mark Excused"
                            >
                              <IconFileText className="w-4 h-4" />
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
        </div>
      </DashboardLayout>
    </>
  );
}
