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

type UserRole = 'admin' | 'teacher' | 'parent';

// ✅ FIXED: Changed paymentStatus to status to match Payment model
interface Payment {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    classLevel: string;
  } | null;
  parentId: {
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
  createdAt?: string;
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
    } else {
      console.log('⚠️ No dbId found in Clerk metadata');
    }
  }, [clerkUser]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const parentDbId = clerkUser?.publicMetadata?.dbId;
      
      console.log('🔍 Fetching payments for parent:', parentDbId);
      
      if (!parentDbId) {
        toast.error('Parent information not found. Please contact administrator.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/payments?role=parent&parentId=${parentDbId}`);
      const data = await response.json();

      console.log('📦 Payments API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payments');
      }

      const paymentsArray = data.payments || [];
      console.log(`✅ Received ${paymentsArray.length} payment records`);
      
      setPayments(paymentsArray);
      calculateStats(paymentsArray);
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      toast.error('Failed to load payment information');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const totalPaid = paymentsData.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const totalOutstanding = paymentsData.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
    
    let lastPaymentDate: string | null = null;
    paymentsData.forEach((payment) => {
      payment.payments.forEach((p) => {
        if (!lastPaymentDate || new Date(p.paymentDate) > new Date(lastPaymentDate)) {
          lastPaymentDate = p.paymentDate;
        }
      });
    });

    setStats({
      totalPaid,
      totalOutstanding,
      paymentsCount: paymentsData.length,
      lastPaymentDate,
    });
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} XAF`;

  const filteredPayments = filterMonth === 'all' 
    ? payments 
    : payments.filter(p => p.month === filterMonth);

  // ✅ Helper function to get status color and label
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'paid':
        return {
          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          label: 'PAID'
        };
      case 'partial':
        return {
          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          label: 'PARTIAL'
        };
      case 'pending':
        return {
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          label: 'PENDING'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
          label: status.toUpperCase()
        };
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={userName} role={userRole}>
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Payment Records
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View your child&apos;s tuition payments and balance
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Paid</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <IconCash className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalOutstanding)}</p>
                </div>
                <IconTrendingUp className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Records</p>
                  <p className="text-2xl font-bold mt-1">{stats.paymentsCount}</p>
                </div>
                <IconReceipt className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Last Payment</p>
                  <p className="text-xl font-bold mt-1">
                    {stats.lastPaymentDate 
                      ? new Date(stats.lastPaymentDate).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : 'No payments'}
                  </p>
                </div>
                <IconCalendar className="w-12 h-12 opacity-30" />
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <IconReceipt className="text-indigo-500" />
                Payment History
              </h3>
              <div className="flex items-center gap-2">
                <IconFilter size={18} className="text-gray-400" />
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 px-3 py-2"
                >
                  <option value="all">All Billing Months</option>
                  {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Billing Month</th>
                    <th className="px-6 py-4">Total Fee</th>
                    <th className="px-6 py-4">Amount Paid</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading payment records...
                        </div>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <IconInfoCircle className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-500 font-medium">No payment records found</p>
                          <p className="text-sm text-gray-400">
                            {filterMonth !== 'all' 
                              ? 'Try selecting a different month or "All Billing Months"' 
                              : 'Payment records will appear here once created by the administrator'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => {
                      const statusInfo = getStatusDisplay(payment.status);
                      return (
                        <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {payment.studentId?.firstName || 'N/A'} {payment.studentId?.lastName || ''}
                            </div>
                            <div className="text-xs text-gray-500">{payment.classLevel}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {payment.month}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(payment.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(payment.amountPaid)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-orange-600 dark:text-orange-400">
                            {payment.balance > 0 ? formatCurrency(payment.balance) : '✓ Cleared'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => { 
                                setSelectedPayment(payment); 
                                setShowDetailsModal(true); 
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all"
                              title="View receipt details"
                            >
                              <IconEye size={20} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

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