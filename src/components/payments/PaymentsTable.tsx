"use client";

import { IconReceipt, IconEye } from "@tabler/icons-react";

// 1. Re-define the interface locally (or import from a shared types file if you have one)
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

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  isAdmin: boolean;
  onViewDetails: (payment: Payment) => void;
}

export default function PaymentsTable({
  payments,
  loading,
  isAdmin,
  onViewDetails,
}: PaymentsTableProps) {
  // Helper: Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
  };

  // Helper: Get Status Text
  const getPaymentStatus = (payment: Payment): string => {
    const statusValue = payment.status ?? payment.paymentStatus ?? "pending";
    return statusValue.replace("_", " ");
  };

  // Helper: Get Status Color
  const getStatusColorClass = (payment: Payment): string => {
    const statusValue = payment.status ?? payment.paymentStatus ?? "pending";

    if (statusValue === "completed" || statusValue === "paid") {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    } else if (statusValue === "partial") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading payments...
        </p>
      </div>
    );
  }

  // 2. Empty State
  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <IconReceipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No payments found
        </p>
      </div>
    );
  }

  // 3. Data Table
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                {/* Student Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {payment.studentId?.firstName?.[0] ?? "?"}
                      {payment.studentId?.lastName?.[0] ?? "?"}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.studentId
                          ? `${payment.studentId.firstName} ${payment.studentId.lastName}`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.classLevel ?? "N/A"}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Month Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {payment.month ?? "N/A"}
                  </div>
                </td>

                {/* Amount Columns */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(payment.totalAmount ?? 0)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(payment.amountPaid ?? 0)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(payment.balance ?? 0)}
                  </div>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColorClass(
                      payment
                    )}`}
                  >
                    {getPaymentStatus(payment)}
                  </span>
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onViewDetails(payment)}
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
    </div>
  );
}
