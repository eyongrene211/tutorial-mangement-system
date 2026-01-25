'use client';

import { useState, useEffect }                        from 'react';
import { DashboardLayout }                            from '@/components/layout/dashboard-layout';
import { IconCalendar, IconSearch, IconCheck, IconX } from '@tabler/icons-react';
import { useUser }                                    from '@clerk/nextjs';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
  status?: string; // ✅ ADDED THIS LINE
}

interface Attendance {
  _id?: string;
  student: Student | string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

export default function TeacherAttendancePage() {
  const { user } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, 'present' | 'absent' | 'late' | 'excused'>>(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Teacher';

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, students.length]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        // ✅ UPDATED: Filter only if status exists
        setStudents(data.filter((s: Student) => !s.status || s.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?date=${selectedDate}`);
      if (response.ok) {
        const data: Attendance[] = await response.json();
        const attendanceMap = new Map<string, 'present' | 'absent' | 'late' | 'excused'>();
        
        data.forEach((record) => {
          const studentId = typeof record.student === 'string' ? record.student : record.student._id;
          attendanceMap.set(studentId, record.status);
        });
        
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    const newAttendance = new Map(attendance);
    newAttendance.set(studentId, status);
    setAttendance(newAttendance);
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      
      const attendanceRecords = Array.from(attendance.entries()).map(([studentId, status]) => ({
        student: studentId,
        date: selectedDate,
        status,
      }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: attendanceRecords }),
      });

      if (response.ok) {
        alert('✅ Attendance saved successfully!');
        fetchAttendance();
      } else {
        alert('❌ Failed to save attendance');
      }
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('❌ Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const newAttendance = new Map<string, 'present' | 'absent' | 'late' | 'excused'>();
    filteredStudents.forEach((student) => {
      newAttendance.set(student._id, status);
    });
    setAttendance(newAttendance);
  };

  const filteredStudents = students.filter((student) =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    present: Array.from(attendance.values()).filter((s) => s === 'present').length,
    absent: Array.from(attendance.values()).filter((s) => s === 'absent').length,
    late: Array.from(attendance.values()).filter((s) => s === 'late').length,
    excused: Array.from(attendance.values()).filter((s) => s === 'excused').length,
  };

  return (
    <DashboardLayout userName={fullName} role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Mark student attendance for the day
            </p>
          </div>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || attendance.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>

        {/* Date and Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-3">
              <IconCalendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAll('present')}
                className="px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg transition-colors text-sm font-medium"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll('absent')}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg transition-colors text-sm font-medium"
              >
                Mark All Absent
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">Present</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {stats.present}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">Absent</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
              {stats.absent}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Late</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
              {stats.late}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">Excused</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {stats.excused}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No students found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <div
                  key={student._id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {student.classLevel}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(student._id, 'present')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          attendance.get(student._id) === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                        }`}
                      >
                        <IconCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student._id, 'absent')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          attendance.get(student._id) === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                        }`}
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student._id, 'late')}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          attendance.get(student._id) === 'late'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(student._id, 'excused')}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          attendance.get(student._id) === 'excused'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
