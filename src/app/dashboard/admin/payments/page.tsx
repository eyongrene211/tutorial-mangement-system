'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import { IconPlus }            from '@tabler/icons-react';

// --- Imported Components ---
import PaymentStats            from '@/components/payments/PaymentStats';
import PaymentFilters          from '@/components/payments/PaymentFilters';
import PaymentsTable           from '@/components/payments/PaymentsTable';
import PaymentModal            from '@/components/payments/PaymentModal';
import PaymentDetailsModal     from '@/components/payments/PaymentDetailsModal';
import EditPaymentModal        from '@/components/admin/EditPaymentModal';

// --- Types (Ideally move these to types.ts) ---
type UserRole = 'admin' | 'teacher' | 'parent';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface Payment {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string; classLevel: string; } | null;
  parentId: { _id: string; firstName: string; lastName: string; email: string; } | null;
  classLevel: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  status?: string; 
  paymentStatus?: string; 
  payments: Array<{
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    receiptNumber: string;
    receivedBy: string;
    notes?: string;
  }>;
}

// --- Constants ---
const CLASS_LEVELS = ['Form1', 'Form2', 'Form3', 'Form4', 'Form5', 'LowerSixth', 'UpperSixth'];
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
  
  // Modals State
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Stats & Filters State
  const [stats, setStats] = useState({
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

  const userRole = (clerkUser?.publicMetadata?.role as UserRole) || 'admin';
  const isAdmin = userRole === 'admin';
  const loggedInUserName = clerkUser ? `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() : 'User';

  // --- Fetch Logic ---
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (response.ok) setStudents(Array.isArray(data) ? data : data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = isAdmin ? '/api/payments?role=admin' : `/api/payments?role=parent&parentId=${clerkUser?.publicMetadata?.dbId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch');

      let paymentsArray = data.payments || [];

      // Filter Logic
      if (filters.month !== 'all') paymentsArray = paymentsArray.filter((p: Payment) => p.month === filters.month);
      if (filters.classLevel !== 'all') paymentsArray = paymentsArray.filter((p: Payment) => p.classLevel === filters.classLevel);
      if (filters.studentId !== 'all') paymentsArray = paymentsArray.filter((p: Payment) => p.studentId?._id === filters.studentId);
      if (filters.paymentMethod !== 'all') {
        paymentsArray = paymentsArray.filter((p: Payment) => p.payments.some((pm) => pm.paymentMethod === filters.paymentMethod));
      }

      setPayments(paymentsArray);
      calculateStats(paymentsArray);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Stats Logic ---
  const calculateStats = (data: Payment[]) => {
    const totalPayments = data.length;
    const totalRevenue = data.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const averagePayment = totalPayments > 0 ? Math.round(totalRevenue / totalPayments) : 0;
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const thisMonthPayments = data.filter((p) => p.month === currentMonth);
    
    // Payment Method totals
    let cashTotal = 0, mobileMoneyTotal = 0, bankTransferTotal = 0;
    data.forEach((record) => {
      record.payments?.forEach((p) => {
        if (p.paymentMethod === 'cash') cashTotal += p.amount;
        if (p.paymentMethod === 'mobile_money') mobileMoneyTotal += p.amount;
        if (p.paymentMethod === 'bank_transfer') bankTransferTotal += p.amount;
      });
    });

    setStats({
      totalPayments,
      totalRevenue,
      averagePayment,
      uniqueStudents: new Set(data.map((p) => p.studentId?._id).filter(Boolean)).size,
      thisMonthRevenue: thisMonthPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0),
      thisMonthCount: thisMonthPayments.length,
      cashTotal, mobileMoneyTotal, bankTransferTotal,
    });
  };

  // --- Effects ---
  useEffect(() => { if (isAdmin) fetchStudents(); }, [isAdmin]);
  useEffect(() => { if (clerkUser) fetchPayments(); }, [filters, clerkUser]);

  // --- Handlers ---
  const handleAddPayment = () => setShowModal(true);
  
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setShowDetailsModal(false); // Close details
    setSelectedPayment(payment); // Ensure selected
    setShowEditModal(true); // Open edit
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    fetchPayments();
  };

  // Generate Month Options (Last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return { value: val, label: val };
  });

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={loggedInUserName} role={userRole}>
        <div className="space-y-6">
          
          {/* 1. Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isAdmin ? 'Payments Management' : 'My Payment History'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isAdmin ? 'Track and manage student payments' : 'View payment receipts'}
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

          {/* 2. Stats Component */}
          <PaymentStats stats={stats} />

          {/* 3. Filters Component */}
          <PaymentFilters 
            filters={filters} 
            setFilters={setFilters}
            isAdmin={isAdmin}
            students={students}
            monthOptions={monthOptions}
            classLevels={CLASS_LEVELS}
            paymentMethods={PAYMENT_METHODS}
          />

          {/* 4. Table Component (The part you requested) */}
          <PaymentsTable 
            payments={payments}
            loading={loading}
            isAdmin={isAdmin}
            onViewDetails={handleViewDetails}
          />

        </div>

        {/* --- Modals Section --- */}
        
        {/* Record Payment Modal */}
        {showModal && (
          <PaymentModal 
            onClose={() => setShowModal(false)} 
            onSuccess={() => { setShowModal(false); fetchPayments(); toast.success('Payment recorded! ✅'); }} 
          />
        )}

        {/* View Details Modal (Note: we pass isAdmin so it can show the Edit button if needed) */}
        {showDetailsModal && selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setShowDetailsModal(false)}
            isAdmin={isAdmin}
            // If you updated PaymentDetailsModal to accept onEdit, uncomment below:
            // onEdit={() => handleEditPayment(selectedPayment)}
          />
        )}

        {/* Edit Payment Modal */}
        {showEditModal && selectedPayment && (
          <EditPaymentModal
            payment={selectedPayment}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}

      </DashboardLayout>
    </>
  );
}