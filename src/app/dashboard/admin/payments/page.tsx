'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import { PaymentModal }        from '@/components/admin/payment-modal';
import {
  IconPlus,
  IconFilter,
  IconCash,
  IconReceipt,
  IconTrendingUp,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconUsers,
} from '@tabler/icons-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface Payment {
  _id: string;
  student: Student;
  amount: number;
  month: string;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber?: string;
  notes?: string;
}

interface Stats {
  totalPayments: number;
  totalRevenue: number;
  averagePayment: number;
  uniqueStudents: number;
  thisMonthRevenue: number;
  thisMonthCount: number;
  cashTotal: number;
  mobileMoneyTotal: number;
  bankTransferTotal: number;
}

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

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function PaymentsPage() {
  const { user: clerkUser } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [stats, setStats] = useState<Stats>({
    totalPayments: 0,
    totalRevenue: 0,
    averagePayment: 0,
    uniqueStudents: 0,
    thisMonthRevenue: 0,
    thisMonthCount: 0,
    cashTotal: 0,
    mobileMoneyTotal: 0,
    bankTransferTotal: 0,
  });

  const [filters, setFilters] = useState({
    month: 'all',
    classLevel: 'all',
    studentId: 'all',
    paymentMethod: 'all',
  });

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin';

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?status=active');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch students');

      const studentsArray = Array.isArray(data) ? data : data.students || [];
      setStudents(studentsArray);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.month !== 'all') params.append('month', filters.month);
      if (filters.studentId !== 'all') params.append('studentId', filters.studentId);
      if (filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);

      const response = await fetch(`/api/payments?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch payments');

      let paymentsArray = Array.isArray(data) ? data : data.payments || [];

      // Filter by class level client-side
      if (filters.classLevel !== 'all') {
        paymentsArray = paymentsArray.filter(
          (p: Payment) => p.student?.classLevel === filters.classLevel
        );
      }

      setPayments(paymentsArray);
      calculateStats(paymentsArray);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
      setPayments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics - FIXED
  const calculateStats = (paymentsData: Payment[]) => {
    const totalPayments = paymentsData.length;
    const totalRevenue = paymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const averagePayment = totalPayments > 0 ? Math.round(totalRevenue / totalPayments) : 0;

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-01"

    const thisMonthPayments = paymentsData.filter((p) => p.month === currentMonth);
    const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const thisMonthCount = thisMonthPayments.length;

    const uniqueStudents = new Set(paymentsData.map((p) => p.student?._id).filter(Boolean)).size;

    const cashTotal = paymentsData
      .filter((p) => p.paymentMethod === 'cash')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const mobileMoneyTotal = paymentsData
      .filter((p) => p.paymentMethod === 'mobile_money')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const bankTransferTotal = paymentsData
      .filter((p) => p.paymentMethod === 'bank_transfer')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    setStats({
      totalPayments,
      totalRevenue,
      averagePayment,
      uniqueStudents,
      thisMonthRevenue,
      thisMonthCount,
      cashTotal,
      mobileMoneyTotal,
      bankTransferTotal,
    });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const handleAddPayment = (student?: Student) => {
    setSelectedStudent(student || null);
    setSelectedPayment(null);
    setShowModal(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedStudent(payment.student);
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      const response = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete payment');
      toast.success('Payment deleted successfully! ✅');
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setSelectedPayment(null);
  };

  const handleModalSave = () => {
    fetchPayments();
    setShowModal(false);
    setSelectedStudent(null);
    setSelectedPayment(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  };

  const formatMonth = (monthString: string) => {
    if (!monthString || !monthString.includes('-')) return 'N/A';
    const [year, month] = monthString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Generate month options for filter (last 12 months)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={loggedInUserName} role="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage student payments</p>
            </div>
            <button
              onClick={() => handleAddPayment()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <IconPlus className="w-5 h-5" />
              <span>Record Payment</span>
            </button>
          </div>

          {/* Stats Cards - FIXED */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <IconCash className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPayments}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <IconReceipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Payment</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.averagePayment)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <IconTrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(stats.thisMonthRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.thisMonthCount} payment{stats.thisMonthCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <IconUsers className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Months</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
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
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center">
                <IconReceipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No payments found</p>
                <button
                  onClick={() => handleAddPayment()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Record First Payment
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
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Receipt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {payments
                      .filter((payment) => payment && payment.student)
                      .map((payment) => (
                        <tr
                          key={payment._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {payment.student.firstName?.[0]}
                                {payment.student.lastName?.[0]}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {payment.student.firstName} {payment.student.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {payment.student.classLevel}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(payment.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatMonth(payment.month)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize">
                              {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <IconCalendar className="w-4 h-4 mr-1" />
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                              {payment.receiptNumber || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditPayment(payment)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <IconEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment._id)}
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

          {/* Payment Method Breakdown */}
          {payments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Methods Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Cash</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>Payments: {payments.filter((p) => p.paymentMethod === 'cash').length}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.cashTotal)}
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Mobile Money</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>Payments: {payments.filter((p) => p.paymentMethod === 'mobile_money').length}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.mobileMoneyTotal)}
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Bank Transfer</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>Payments: {payments.filter((p) => p.paymentMethod === 'bank_transfer').length}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.bankTransferTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <PaymentModal
            student={selectedStudent || undefined}
            payment={selectedPayment || undefined}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />
        )}
      </DashboardLayout>
    </>
  );
}
