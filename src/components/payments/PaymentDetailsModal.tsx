'use client';

import { useState }                                  from 'react';
import { IconX, IconReceipt, IconPrinter, IconEdit } from '@tabler/icons-react';
import EditPaymentModal                              from '../admin/EditPaymentModal';

interface Payment {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string; classLevel: string; } | null;
  parentId: { firstName: string; lastName: string; email: string; phone?: string; } | null;
  classLevel: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  status: string; // Synced with schema
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

export default function PaymentDetailsModal({ payment: initialPayment, onClose, isAdmin }: PaymentDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [payment, setPayment] = useState(initialPayment);

  const handlePrint = () => {
    window.print();
  };

  // If edit modal is open, show that instead
  if (showEditModal) {
    return (
      <EditPaymentModal 
        payment={payment} 
        onClose={() => setShowEditModal(false)} 
        onSuccess={() => {
          // This would ideally re-fetch or you can close and refresh parent
          setShowEditModal(false);
          onClose(); 
        }} 
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <IconReceipt className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold dark:text-white">Payment Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <IconX className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold">Student</p>
              <p className="font-semibold dark:text-white">
                {payment.studentId?.firstName ?? 'N/A'} {payment.studentId?.lastName ?? ''}
              </p>
              <p className="text-sm text-gray-500">{payment.classLevel}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold">Billing Month</p>
              <p className="font-semibold dark:text-white">{payment.month}</p>
              <p className="text-sm text-gray-500 capitalize">
                Status: <span className={payment.balance <= 0 ? 'text-green-600' : 'text-orange-500'}>
                  {(payment.status ?? 'pending').replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>

          <div className="border dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Receipt #</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {payment.payments.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-right font-bold">{p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="divide-y dark:divide-gray-700 border-t dark:border-gray-700">
                <tr className="bg-gray-50/50 dark:bg-gray-900/20">
                  <td colSpan={2} className="px-4 py-2 text-gray-500">Total Fee</td>
                  <td className="px-4 py-2 text-right font-semibold">{payment.totalAmount.toLocaleString()} {payment.currency}</td>
                </tr>
                <tr className="bg-indigo-50 dark:bg-indigo-900/20 font-bold">
                  <td colSpan={2} className="px-4 py-3">Total Paid</td>
                  <td className="px-4 py-3 text-right text-indigo-600">{payment.amountPaid.toLocaleString()} {payment.currency}</td>
                </tr>
                {payment.balance > 0 && (
                  <tr className="bg-red-50 dark:bg-red-900/20 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-red-600">Balance Due</td>
                    <td className="px-4 py-3 text-right text-red-600">{payment.balance.toLocaleString()} {payment.currency}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <IconPrinter className="w-4 h-4" /> Print
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <IconEdit className="w-4 h-4" /> Edit Record
            </button>
          )}
        </div>
      </div>
    </div>
  );
}