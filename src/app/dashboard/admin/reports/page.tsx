'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import {
  IconFileReport,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconCalendarStats,
  IconCash,
  IconDownload,
  IconFilter,
  IconChartBar,
  IconAward,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';

interface OverviewStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalGrades: number;
  totalAttendance: number;
}

interface StudentReport {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    classLevel: string;
  };
  totalGrades: number;
  averagePercentage: number;
  subjectBreakdown: Record<string, { count: number; average: number }>;
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

interface AttendanceReport {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    classLevel: string;
  };
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface FinancialReport {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    classLevel: string;
  };
  monthlyFee: number;
  expectedTotal: number;
  paid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  parentContact: string;
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

export default function ReportsPage() {
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'attendance' | 'financial'>('overview');
  const [loading, setLoading] = useState(false);

  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    classLevel: 'all',
  });

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin';

  useEffect(() => {
    fetchReportData();
  }, [activeTab, filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.classLevel !== 'all') params.append('classLevel', filters.classLevel);

      // ✅ Use the correct API endpoints based on your structure
      let endpoint = '';
      if (activeTab === 'overview') {
        endpoint = `/api/reports/overview?${params.toString()}`;
      } else if (activeTab === 'students') {
        endpoint = `/api/reports/student-performance?${params.toString()}`;
      } else if (activeTab === 'attendance') {
        endpoint = `/api/reports/attendance?${params.toString()}`;
      } else if (activeTab === 'financial') {
        endpoint = `/api/reports/financial?${params.toString()}`;
      }

      console.log('🔍 Fetching from:', endpoint);

      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report data');
      }

      console.log('✅ Report data received:', data);

      if (activeTab === 'overview') {
        setOverviewStats(data);
      } else if (activeTab === 'students') {
        setStudentReports(data);
      } else if (activeTab === 'attendance') {
        setAttendanceReports(data);
      } else if (activeTab === 'financial') {
        setFinancialReports(data);
      }
    } catch (error) {
      console.error('❌ Error fetching report:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    toast.success('Export feature coming soon! 📊');
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'average':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'needs-improvement':
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'paid':
        return <IconCheck className="w-5 h-5 text-green-600" />;
      case 'good':
      case 'partial':
        return <IconCheck className="w-5 h-5 text-blue-600" />;
      case 'average':
        return <IconAlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'poor':
      case 'unpaid':
      case 'needs-improvement':
        return <IconX className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
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
                Reports & Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive insights into student performance, attendance, and finances
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <IconDownload className="w-5 h-5" />
              <span>Export Report</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconFileReport className="w-5 h-5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'students'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconChartBar className="w-5 h-5" />
                <span>Student Performance</span>
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'attendance'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconCalendarStats className="w-5 h-5" />
                <span>Attendance</span>
              </button>

              <button
                onClick={() => setActiveTab('financial')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'financial'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconCash className="w-5 h-5" />
                <span>Financial</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          {activeTab !== 'overview' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <IconFilter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading report data...</p>
              </div>
            ) : (
              <>
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && overviewStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <IconUsers className="w-6 h-6" />
                        </div>
                        <IconTrendingUp className="w-8 h-8 opacity-50" />
                      </div>
                      <h3 className="text-sm font-medium opacity-90 mb-1">Total Students</h3>
                      <p className="text-3xl font-bold">{overviewStats.totalStudents}</p>
                      <div className="mt-4 flex items-center space-x-4 text-sm">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          Active: {overviewStats.activeStudents}
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                          Inactive: {overviewStats.inactiveStudents}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <IconAward className="w-6 h-6" />
                        </div>
                        <IconTrendingUp className="w-8 h-8 opacity-50" />
                      </div>
                      <h3 className="text-sm font-medium opacity-90 mb-1">Total Grades</h3>
                      <p className="text-3xl font-bold">{overviewStats.totalGrades}</p>
                      <p className="mt-4 text-sm opacity-90">Academic records tracked</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <IconCalendarStats className="w-6 h-6" />
                        </div>
                        <IconTrendingUp className="w-8 h-8 opacity-50" />
                      </div>
                      <h3 className="text-sm font-medium opacity-90 mb-1">Attendance Records</h3>
                      <p className="text-3xl font-bold">{overviewStats.totalAttendance}</p>
                      <p className="mt-4 text-sm opacity-90">Days tracked</p>
                    </div>
                  </div>
                )}

                {/* STUDENT PERFORMANCE TAB */}
                {activeTab === 'students' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {studentReports.length === 0 ? (
                      <div className="p-12 text-center">
                        <IconChartBar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No performance data available</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Add grades to students to see performance reports
                        </p>
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
                                Total Tests
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Average Score
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Performance
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Subjects
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {studentReports.map((report) => (
                              <tr key={report.student._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                      {report.student.firstName[0]}{report.student.lastName[0]}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.student.firstName} {report.student.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {report.student.classLevel}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {report.totalGrades}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                      {report.averagePercentage}%
                                    </span>
                                    {report.averagePercentage >= 70 ? (
                                      <IconTrendingUp className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <IconTrendingDown className="w-4 h-4 text-red-600" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getPerformanceBadge(
                                      report.performance
                                    )}`}
                                  >
                                    {report.performance.replace('-', ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {Object.keys(report.subjectBreakdown).slice(0, 3).map((subject) => (
                                      <span
                                        key={subject}
                                        className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 rounded"
                                      >
                                        {subject}: {report.subjectBreakdown[subject].average}%
                                      </span>
                                    ))}
                                    {Object.keys(report.subjectBreakdown).length > 3 && (
                                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                                        +{Object.keys(report.subjectBreakdown).length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {attendanceReports.length === 0 ? (
                      <div className="p-12 text-center">
                        <IconCalendarStats className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No attendance data available</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Record student attendance to see reports
                        </p>
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
                                Total Days
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Present
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Absent
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Late
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Attendance Rate
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {attendanceReports.map((report) => (
                              <tr key={report.student._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                                      {report.student.firstName[0]}{report.student.lastName[0]}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.student.firstName} {report.student.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {report.student.classLevel}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {report.totalDays}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {report.presentDays}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                    {report.absentDays}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                    {report.lateDays}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-[80px]">
                                      <div
                                        className={`h-2 rounded-full ${
                                          report.attendanceRate >= 90
                                            ? 'bg-green-600'
                                            : report.attendanceRate >= 75
                                            ? 'bg-blue-600'
                                            : report.attendanceRate >= 60
                                            ? 'bg-yellow-600'
                                            : 'bg-red-600'
                                        }`}
                                        style={{ width: `${report.attendanceRate}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                      {report.attendanceRate}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(report.status)}
                                    <span
                                      className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getPerformanceBadge(
                                        report.status
                                      )}`}
                                    >
                                      {report.status}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* FINANCIAL TAB */}
                {activeTab === 'financial' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {financialReports.length === 0 ? (
                      <div className="p-12 text-center">
                        <IconCash className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No financial data available</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          This section shows sample data for preview
                        </p>
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
                                Monthly Fee
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Expected Total
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Paid
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Balance
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Parent Contact
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {financialReports.map((report) => (
                              <tr key={report.student._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                                      {report.student.firstName[0]}{report.student.lastName[0]}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.student.firstName} {report.student.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {report.student.classLevel}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {report.monthlyFee.toLocaleString()} FCFA
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {report.expectedTotal.toLocaleString()} FCFA
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {report.paid.toLocaleString()} FCFA
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`text-sm font-semibold ${
                                      report.balance > 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-green-600 dark:text-green-400'
                                    }`}
                                  >
                                    {report.balance.toLocaleString()} FCFA
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(report.status)}
                                    <span
                                      className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getPerformanceBadge(
                                        report.status
                                      )}`}
                                    >
                                      {report.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {report.parentContact}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
