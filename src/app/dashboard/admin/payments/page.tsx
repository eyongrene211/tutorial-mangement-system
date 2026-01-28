'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import {
  IconPlus,
  IconFilter,
  IconCash,
  IconReceipt,
  IconTrendingUp,
  IconEye,
  IconCalendar,
  IconUsers,
} from '@tabler/icons-react';
import PaymentModal            from '@/components/payments/PaymentModal';
import PaymentDetailsModal     from '@/components/payments/PaymentDetailsModal';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface Payment {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    classLevel: string;
  } | null;
  parentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  classLevel: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  paymentStatus: string;
  payments: Array<{
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    receiptNumber: string;
    receivedBy: string;
    notes?: string;
  }>;
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
  'Form1',
  'Form2',
  'Form3',
  'Form4',
  'Form5',
  'LowerSixth',
  'UpperSixth',
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
];

export default function PaymentsPage() {
  const { user: clerkUser } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const userRole = (clerkUser?.publicMetadata?.role as string) || 'admin';
  const isAdmin = userRole === 'admin';

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User'
    : 'User';

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
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

      const url = isAdmin
        ? '/api/payments?role=admin'
        : `/api/payments?role=parent&parentId=${clerkUser?.publicMetadata?.dbId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch payments');

      let paymentsArray = data.payments || [];

      // Apply filters
      if (filters.month !== 'all') {
        paymentsArray = paymentsArray.filter((p: Payment) => p.month === filters.month);
      }
      if (filters.classLevel !== 'all') {
        paymentsArray = paymentsArray.filter((p: Payment) => p.classLevel === filters.classLevel);
      }
      if (filters.studentId !== 'all') {
        paymentsArray = paymentsArray.filter((p: Payment) => p.studentId?._id === filters.studentId);
      }
      if (filters.paymentMethod !== 'all') {
        paymentsArray = paymentsArray.filter((p: Payment) =>
          p.payments.some((payment) => payment.paymentMethod === filters.paymentMethod)
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

  // Calculate statistics
  const calculateStats = (paymentsData: Payment[]) => {
    const totalPayments = paymentsData.length;
    const totalRevenue = paymentsData.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const averagePayment = totalPayments > 0 ? Math.round(totalRevenue / totalPayments) : 0;

    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const thisMonthPayments = paymentsData.filter((p) => p.month === currentMonth);
    const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const thisMonthCount = thisMonthPayments.length;

    const uniqueStudents = new Set(paymentsData.map((p) => p.studentId?._id).filter(Boolean)).size;

    // Calculate by payment method
    let cashTotal = 0;
    let mobileMoneyTotal = 0;
    let bankTransferTotal = 0;

    paymentsData.forEach((record) => {
      record.payments.forEach((payment) => {
        if (payment.paymentMethod === 'cash') cashTotal += payment.amount;
        if (payment.paymentMethod === 'mobile_money') mobileMoneyTotal += payment.amount;
        if (payment.paymentMethod === 'bank_transfer') bankTransferTotal += payment.amount;
      });
    });

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
    if (isAdmin) {
      fetchStudents();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (clerkUser) {
      fetchPayments();
    }
  }, [filters, clerkUser]);

  const handleAddPayment = () => {
    setShowModal(true);
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSave = () => {
    fetchPayments();
    setShowModal(false);
    toast.success('Payment recorded successfully! ✅');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  };

  // Generate month options for filter (last 12 months)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label: value });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Fix: Ensure role is one of the allowed types
  const getDashboardRole = (): 'admin' | 'teacher' | 'parent' => {
    if (userRole === 'admin') return 'admin';
    if (userRole === 'teacher') return 'teacher';
    return 'parent';
  };

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={loggedInUserName} role={getDashboardRole()}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isAdmin ? 'Payments Management' : 'My Payment History'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isAdmin ? 'Track and manage student payments' : 'View payment receipts for tutorial classes'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleAddPayment}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <IconPlus className="w-5 h-5" />
                <span>Record Payment</span>
              </button>
            )}
          </div>

          {/* Stats Cards */}
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

              {isAdmin && (
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
              )}
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
                {isAdmin && (
                  <button
                    onClick={handleAddPayment}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Record First Payment
                  </button>
                )}
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
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Total Fee
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map((payment) => (
                      <tr
                        key={payment._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                              {payment.studentId?.firstName?.[0]}
                              {payment.studentId?.lastName?.[0]}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.studentId
                                  ? `${payment.studentId.firstName} ${payment.studentId.lastName}`
                                  : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {payment.classLevel}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{payment.month}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(payment.totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(payment.amountPaid)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(payment.balance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              payment.paymentStatus === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : payment.paymentStatus === 'partial'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}
                          >
                            {payment.paymentStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(payment)}
                            className="flex items-center space-x-1 p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            title="View Receipt"
                          >
                            <IconEye className="w-4 h-4" />
                            <span className="text-xs">View</span>
                          </button>
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
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.cashTotal)}
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Mobile Money</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.mobileMoneyTotal)}
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Bank Transfer</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.bankTransferTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showModal && <PaymentModal onClose={handleModalClose} onSuccess={handleModalSave} />}

        {showDetailsModal && selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setShowDetailsModal(false)}
            isAdmin={isAdmin}
          />
        )}
      </DashboardLayout>
    </>
  );
}
