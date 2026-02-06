'use client';

import { useState, useEffect }                                                      from 'react';
import { IconX, IconCash, IconCalendar, IconNotes, IconAlertCircle, IconUserCheck } from '@tabler/icons-react';
import toast                                                                        from 'react-hot-toast';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
  parentUser?: string | any;
  parentInfo?: { name: string; phone: string };
}

interface PaymentData {
  _id?: string;
  studentId: string;
  month: string;
  totalAmount: number;
  paymentAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
}

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  payment?: PaymentData | null;
  mode?: 'create' | 'edit' | 'add';
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'card', label: 'Card', icon: '💳' },
];

export default function PaymentModal({ 
  onClose, 
  onSuccess, 
  payment = null,
  mode = 'create' 
}: PaymentModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<PaymentData>({
    studentId: payment?.studentId || '',
    month: payment?.month || '',
    totalAmount: payment?.totalAmount || 0,
    paymentAmount: mode === 'add' ? 0 : (payment?.paymentAmount || 0),
    paymentMethod: payment?.paymentMethod || 'cash',
    paymentDate: payment?.paymentDate 
      ? new Date(payment.paymentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: payment?.notes || '',
  });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      // FIX #1: Handle both formats
      setStudents(Array.isArray(data) ? data : data.students || []);
    } catch (error: unknown) {
      toast.error('Failed to load students');
    }
  };

  const getCurrentMonth = () => {
    const date = new Date();
    return `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
  };

  const getTitle = () => {
    switch (mode) {
      case 'edit': return 'Edit Payment Info';
      case 'add': return 'Add Installment';
      default: return 'Record New Payment';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    switch (mode) {
      case 'edit': return 'Update Record';
      case 'add': return 'Add Payment';
      default: return 'Record Payment';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let url = '/api/payments';
      let method = 'POST';
      let bodyData: any;

      if (mode === 'add' && payment?._id) {
        url = `/api/payments/${payment._id}/add`;
        bodyData = {
          amount: Number(formData.paymentAmount),
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          notes: formData.notes,
        };
      } else if (mode === 'edit' && payment?._id) {
        url = `/api/payments/${payment._id}`;
        method = 'PATCH'; 
        bodyData = {
          month: formData.month,
          totalAmount: Number(formData.totalAmount),
        };
      } else {
        // FIX #2: Use 'amountPaid' not 'paymentAmount'
        bodyData = {
          studentId: formData.studentId,
          month: formData.month || getCurrentMonth(),
          totalAmount: Number(formData.totalAmount),
          amountPaid: Number(formData.paymentAmount), // ← FIXED
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          notes: formData.notes,
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Success!');
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to process');
      }
    } catch (error: unknown) {
      toast.error('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center text-white">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <IconCash className="w-7 h-7" /> {getTitle()}
              </h2>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition-all">
              <IconX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Student <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              disabled={mode !== 'create'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Student</option>
              {students.map((student) => {
                const hasParent = !!student.parentUser;
                return (
                  <option 
                    key={student._id} 
                    value={student._id} 
                    disabled={!hasParent}
                    className={!hasParent ? "text-red-400" : ""}
                  >
                    {student.firstName} {student.lastName} - {student.classLevel} {hasParent ? `(Linked to: ${student.parentInfo?.name})` : '(❌ NO PARENT LINKED)'}
                  </option>
                );
              })}
            </select>
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
               <IconAlertCircle className="w-3 h-3"/> Only students with linked parent accounts can be selected.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Month</label>
            <input
              type="text"
              placeholder={getCurrentMonth()}
              value={formData.month}
              disabled={mode === 'add'}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monthly Fee (XAF)</label>
              <input
                type="number"
                required
                disabled={mode === 'add'}
                value={formData.totalAmount || ''}
                onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {mode === 'add' ? 'Installment Amount' : 'Amount Paid'} (XAF)
              </label>
              <input
                type="number"
                required
                disabled={mode === 'edit'}
                value={formData.paymentAmount || ''}
                onChange={(e) => setFormData({ ...formData, paymentAmount: Number(e.target.value) })}
                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {formData.totalAmount > 0 && mode !== 'edit' && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-indigo-900 dark:text-indigo-200">Balance after this:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.max(0, formData.totalAmount - (formData.paymentAmount + (mode === 'add' ? (payment?.paymentAmount || 0) : 0))).toLocaleString()} XAF
                </span>
              </div>
            </div>
          )}

          {mode !== 'edit' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: m.value })}
                      className={`p-3 border-2 rounded-xl flex items-center gap-2 ${
                        formData.paymentMethod === m.value ? 'border-indigo-600 bg-indigo-400' : 'border-gray-200'
                      }`}
                    >
                      <span>{m.icon}</span> <span className="text-sm font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Payment Date</label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 resize-none"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border rounded-xl font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg">
              {getButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}