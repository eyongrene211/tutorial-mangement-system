'use client';

import { useState }                                  from 'react';
import { IconX, IconReceipt, IconPrinter, IconEdit } from '@tabler/icons-react';
import EditPaymentModal                              from '../admin/EditPaymentModal';

// Update this interface to match your global Payment type exactly
interface Payment {
  _id: string;
  studentId: { 
    _id: string; 
    firstName: string; 
    lastName: string; 
    classLevel: string; 
  } | null;
  parentId: { 
    _id: string; // Added this to resolve the error
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
  status: string;
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

interface PaymentDetailsModalProps {
  payment: Payment;
  onClose: () => void;
  isAdmin: boolean;
}

export default function PaymentDetailsModal({ payment: initialPayment, onClose, isAdmin }: PaymentDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  // Remove the static state for payment if you want it to reflect edits immediately,
  // or use the initialPayment prop directly.
  const [payment] = useState(initialPayment);

  const handlePrint = () => {
    window.print();
  };

  if (showEditModal) {
    return (
      <EditPaymentModal 
        payment={{ ...payment, paymentStatus: payment.paymentStatus ?? '' }} 
        onClose={() => setShowEditModal(false)} 
        onSuccess={() => {
          setShowEditModal(false);
          onClose(); 
        }} 
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 print:hidden">
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
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto print:max-h-full print:overflow-visible">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-transparent dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Student</p>
              <p className="font-semibold dark:text-white">
                {payment.studentId?.firstName ?? 'N/A'} {payment.studentId?.lastName ?? ''}
              </p>
              <p className="text-sm text-gray-500">{payment.classLevel}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-transparent dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Billing Month</p>
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Receipt #</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {payment.payments.length > 0 ? (
                  payment.payments.map((p, i) => (
                    <tr key={i} className="dark:text-gray-300">
                      <td className="px-4 py-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.receiptNumber}</td>
                      <td className="px-4 py-3 text-right font-bold">{p.amount.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No payment records found</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="divide-y dark:divide-gray-700 border-t dark:border-gray-700">
                <tr className="bg-gray-50/50 dark:bg-gray-900/20">
                  <td colSpan={2} className="px-4 py-2 text-gray-500">Total Fee</td>
                  <td className="px-4 py-2 text-right font-semibold dark:text-gray-300">{payment.totalAmount.toLocaleString()} {payment.currency}</td>
                </tr>
                <tr className="bg-indigo-50 dark:bg-indigo-900/20 font-bold">
                  <td colSpan={2} className="px-4 py-3 text-indigo-900 dark:text-indigo-300">Total Paid</td>
                  <td className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400">{payment.amountPaid.toLocaleString()} {payment.currency}</td>
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
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            <IconPrinter className="w-4 h-4" /> Print
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <IconEdit className="w-4 h-4" /> Edit Record
            </button>
          )}
        </div>
      </div>
    </div>
  );
}