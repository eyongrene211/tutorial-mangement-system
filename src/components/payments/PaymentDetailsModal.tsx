'use client';

import { IconX, IconDownload, IconReceipt } from '@tabler/icons-react';

interface Payment {
  _id: string;
  studentId: {
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

interface PaymentDetailsModalProps {
  payment: Payment;
  onClose: () => void;
  isAdmin: boolean;
}

export default function PaymentDetailsModal({ payment, onClose, isAdmin }: PaymentDetailsModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <IconReceipt className="w-7 h-7 text-indigo-600" />
            Payment Details
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <IconDownload className="w-5 h-5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student & Parent Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Student Information</h3>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {payment.studentId ? `${payment.studentId.firstName} ${payment.studentId.lastName}` : 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Class: {payment.classLevel}</p>
            </div>

            {isAdmin && payment.parentId && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Parent Information</h3>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {payment.parentId.firstName} {payment.parentId.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{payment.parentId.email}</p>
                {payment.parentId.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{payment.parentId.phone}</p>
                )}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Summary - {payment.month}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Fee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {payment.totalAmount.toLocaleString()} {payment.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {payment.amountPaid.toLocaleString()} {payment.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {payment.balance.toLocaleString()} {payment.currency}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                payment.paymentStatus === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : payment.paymentStatus === 'partial'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                Status: {payment.paymentStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment History</h3>
            <div className="space-y-3">
              {payment.payments.map((p, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Receipt: {p.receiptNumber}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(p.paymentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Method: <span className="capitalize">{p.paymentMethod.replace('_', ' ')}</span>
                      </p>
                      {p.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                          Note: {p.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {p.amount.toLocaleString()} {payment.currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>TutorialMS - Afterschool Tutorial Management System</p>
            <p className="mt-1">This is an official payment receipt</p>
          </div>
        </div>
      </div>
    </div>
  );
}
