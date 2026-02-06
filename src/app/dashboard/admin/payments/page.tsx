'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import {
  IconReceipt,
  IconCash,
  IconTrendingUp,
  IconEye,
  IconCalendar,
  IconFilter,
  IconInfoCircle,
} from '@tabler/icons-react';
import PaymentDetailsModal     from '@/components/payments/PaymentDetailsModal';

// 1. Define strict types to avoid 'any' errors
type UserRole = 'admin' | 'teacher' | 'parent';

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
    phone?: string;
  } | null;
  classLevel: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  status: string; // ✅ FIXED: Changed from paymentStatus to status
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
  totalPaid: number;
  totalOutstanding: number;
  paymentsCount: number;
  lastPaymentDate: string | null;
}

export default function ParentPaymentsPage() {
  const { user: clerkUser } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalPaid: 0,
    totalOutstanding: 0,
    paymentsCount: 0,
    lastPaymentDate: null,
  });
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Safely cast the role to the expected type
  const userRole = (clerkUser?.publicMetadata?.role as UserRole) || 'parent';
  const userName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User'
    : 'User';

  const uniqueMonths = Array.from(
    new Set(payments.map((p) => p.month))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  useEffect(() => {
    if (clerkUser?.publicMetadata?.dbId) {
      fetchPayments();
    }
  }, [clerkUser]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const parentDbId = clerkUser?.publicMetadata?.dbId;
      
      if (!parentDbId) {
        toast.error('Parent information not found');
        return;
      }

      console.log('🔍 Fetching payments for parent:', parentDbId); // Debug log
      
      const response = await fetch(`/api/payments?role=parent&parentId=${parentDbId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payments');
      }

      console.log('✅ Received payments:', data.payments?.length || 0); // Debug log

      const paymentsArray = data.payments || [];
      
      // Apply month filter if selected
      const filteredPayments = filterMonth === 'all' 
        ? paymentsArray 
        : paymentsArray.filter((p: Payment) => p.month === filterMonth);
      
      setPayments(filteredPayments);
      calculateStats(filteredPayments);
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const totalPaid = paymentsData.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const totalOutstanding = paymentsData.reduce((sum, p) => sum + (p.balance || 0), 0);
    const paymentsCount = paymentsData.length;
    
    // Find most recent payment date
    const dates = paymentsData
      .flatMap(p => p.payments.map(pay => new Date(pay.paymentDate)))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    
    const lastPaymentDate = dates.length > 0 
      ? dates[0].toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

    setStats({ totalPaid, totalOutstanding, paymentsCount, lastPaymentDate });
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  };

  const filteredPayments = filterMonth === 'all' 
    ? payments 
    : payments.filter((p) => p.month === filterMonth);

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={userName} role={userRole}>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment History</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View your payment records and receipts
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Paid</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <IconCash className="w-12 h-12 text-white opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Outstanding</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalOutstanding)}</p>
                </div>
                <IconReceipt className="w-12 h-12 text-white opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Records</p>
                  <p className="text-2xl font-bold mt-1">{stats.paymentsCount}</p>
                </div>
                <IconTrendingUp className="w-12 h-12 text-white opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Last Payment</p>
                  <p className="text-sm font-semibold mt-1">
                    {stats.lastPaymentDate || 'No payments yet'}
                  </p>
                </div>
                <IconCalendar className="w-12 h-12 text-white opacity-80" />
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <IconFilter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filter by Month</h3>
            </div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Months</option>
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          {/* Payments Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payment history...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <IconReceipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No payment records found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Payment receipts will appear here once recorded by the admin
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                              {payment.studentId?.firstName?.[0]}{payment.studentId?.lastName?.[0]}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.studentId ? `${payment.studentId.firstName} ${payment.studentId.lastName}` : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{payment.classLevel}</div>
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
                          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : payment.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(payment)}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          >
                            <IconEye className="w-4 h-4" />
                            <span className="text-xs">View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Card */}
          {filteredPayments.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <IconInfoCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Payment Information</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click &quot;View Receipt&quot; to see detailed payment history. For any payment inquiries, please contact the school administration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setShowDetailsModal(false)}
            isAdmin={false}
          />
        )}
      </DashboardLayout>
    </>
  );
}