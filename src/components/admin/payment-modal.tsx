'use client';

import { useState, useEffect } from 'react';
import { IconX, IconCash }     from '@tabler/icons-react';
import toast                   from 'react-hot-toast';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
  monthlyFee?: number;
}

interface PaymentModalProps {
  student?: Student;
  payment?: {
    _id: string;
    amount: number;
    month: string;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  };
  onClose: () => void;
  onSave: () => void;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money (MTN/Orange)' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export function PaymentModal({ student: preSelectedStudent, payment, onClose, onSave }: PaymentModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    month: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preSelectedStudent) {
      setSelectedStudentId(preSelectedStudent._id);
      setFormData((prev) => ({
        ...prev,
        amount: preSelectedStudent.monthlyFee?.toString() || '',
      }));
    }

    if (payment) {
      setFormData({
        amount: payment.amount?.toString() || '',
        month: payment.month || '',
        paymentDate: payment.paymentDate
          ? new Date(payment.paymentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        paymentMethod: payment.paymentMethod || 'cash',
        notes: payment.notes || '',
      });
      setSelectedStudentId(preSelectedStudent?._id || '');
    } else {
      const currentMonth = new Date().toISOString().slice(0, 7);
      setFormData((prev) => ({
        ...prev,
        month: currentMonth,
      }));
    }
  }, [payment, preSelectedStudent]);

  useEffect(() => {
    if (!preSelectedStudent && !payment) {
      fetchStudents();
    }
  }, [preSelectedStudent, payment]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await fetch('/api/students?status=active');

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      const studentsArray = Array.isArray(data) ? data : data.students || [];
      setStudents(studentsArray);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    setSelectedStudentId(studentId);
    if (student?.monthlyFee) {
      setFormData((prev) => ({
        ...prev,
        amount: student.monthlyFee!.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const studentId = preSelectedStudent?._id || selectedStudentId;

    if (!studentId) {
      setError('Please select a student');
      return;
    }

    if (!formData.amount || formData.amount.trim() === '') {
      setError('Amount is required');
      return;
    }

    if (!formData.month) {
      setError('Month is required');
      return;
    }

    if (!formData.paymentDate) {
      setError('Payment date is required');
      return;
    }

    const amountNum = parseFloat(formData.amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        studentId: studentId,
        amount: amountNum,
        month: formData.month,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim() || undefined,
      };

      let response;
      if (payment) {
        response = await fetch(`/api/payments/${payment._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment');
      }

      toast.success(payment ? 'Payment updated successfully! ✅' : 'Payment recorded successfully! ✅');

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Generate month options (last 12 months + next 3 months)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();

    // Past 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    // Next 3 months
    for (let i = 1; i <= 3; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {payment ? 'Edit Payment' : 'Record New Payment'}
            </h2>
            {preSelectedStudent && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Student: {preSelectedStudent.firstName} {preSelectedStudent.lastName} ({preSelectedStudent.classLevel})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Student Selector */}
          {!preSelectedStudent && !payment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Student <span className="text-red-500">*</span>
              </label>
              {loadingStudents ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-2">Loading students...</p>
                </div>
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select a Student --</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} - {student.classLevel}
                      {student.monthlyFee ? ` (${student.monthlyFee.toLocaleString()} FCFA/month)` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Amount & Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g., 15000"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Month <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Month --</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Add any additional information about this payment..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Payment Summary */}
          {formData.amount && formData.month && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Payment Summary
              </h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Amount:</span>{' '}
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    {parseFloat(formData.amount || '0').toLocaleString()} FCFA
                  </span>
                </p>
                <p>
                  <span className="font-medium">For Month:</span>{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {monthOptions.find((m) => m.value === formData.month)?.label || formData.month}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Method:</span>{' '}
                  <span className="capitalize">
                    {PAYMENT_METHODS.find((m) => m.value === formData.paymentMethod)?.label}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loadingStudents}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{payment ? 'Update Payment' : 'Record Payment'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
