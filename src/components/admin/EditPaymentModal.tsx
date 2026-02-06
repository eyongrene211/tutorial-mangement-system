'use client';

import { useState, useEffect }                  from 'react';
import { IconX, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import toast                                    from 'react-hot-toast';

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

interface EditPaymentModalProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPaymentModal({ payment, onClose, onSuccess }: EditPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    month: payment.month,
    totalAmount: payment.totalAmount.toString(),
  });

  const [individualPayments, setIndividualPayments] = useState(payment.payments);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: '',
  });
  const [showAddPayment, setShowAddPayment] = useState(false);

  const handleUpdateBasicInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/${payment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: formData.month,
          totalAmount: parseFloat(formData.totalAmount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update payment');
      }

      toast.success('Payment information updated!');
      onSuccess();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIndividualPayment = async () => {
    try {
      if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/payments/${payment._id}/add-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newPayment.amount),
          paymentDate: newPayment.paymentDate,
          paymentMethod: newPayment.paymentMethod,
          notes: newPayment.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add payment');
      }

      toast.success('Payment added successfully!');
      setShowAddPayment(false);
      setNewPayment({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: '',
      });
      onSuccess();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndividualPayment = async (receiptNumber: string) => {
    if (!confirm('Are you sure you want to delete this individual payment entry?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/payments/${payment._id}/remove-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete payment');
      }

      toast.success('Payment entry deleted!');
      onSuccess();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPaid = () => {
    return individualPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const calculateBalance = () => {
    return parseFloat(formData.totalAmount || '0') - calculateTotalPaid();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <IconEdit className="w-7 h-7 text-blue-600" />
              Edit Payment Record
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {payment.studentId
                ? `${payment.studentId.firstName} ${payment.studentId.lastName}`
                : 'Student'}{' '}
              - {payment.month}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Basic Information */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <input
                  type="text"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., January 2025"
                />
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Fee (XAF)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., 20000"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateBasicInfo}
              disabled={loading}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Basic Info'}
            </button>
          </div>

          {/* Payment Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Fee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(formData.totalAmount || '0').toLocaleString()} XAF
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculateTotalPaid().toLocaleString()} XAF
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {calculateBalance() === 0 ? 'Balance (Fully Paid)' : 'Balance (Remaining)'}
                </p>
                <p className={`text-2xl font-bold ${calculateBalance() === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {calculateBalance().toLocaleString()} XAF
                </p>
              </div>
            </div>
          </div>

          {/* Individual Payments */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment History ({individualPayments.length})
              </h3>
              <button
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <IconPlus className="w-4 h-4" />
                Add Payment
              </button>
            </div>

            {/* Add New Payment Form */}
            {showAddPayment && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Add New Payment Entry
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (XAF) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                      placeholder="e.g., 10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={newPayment.paymentDate}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, paymentDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={newPayment.paymentMethod}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, paymentMethod: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="card">Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddIndividualPayment}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Payment'}
                  </button>
                  <button
                    onClick={() => setShowAddPayment(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Payment List */}
            <div className="space-y-3">
              {individualPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No payments recorded yet
                </div>
              ) : (
                individualPayments.map((p, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Receipt: {p.receiptNumber}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              p.paymentMethod === 'cash'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : p.paymentMethod === 'mobile_money'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : p.paymentMethod === 'bank_transfer'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}
                          >
                            {p.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(p.paymentDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {p.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                            Note: {p.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {p.amount.toLocaleString()} XAF
                        </p>
                        <button
                          onClick={() => handleDeleteIndividualPayment(p.receiptNumber)}
                          disabled={loading}
                          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Payment Entry"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}