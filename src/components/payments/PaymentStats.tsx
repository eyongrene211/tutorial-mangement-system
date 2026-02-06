import { IconCash, IconReceipt, IconTrendingUp, IconUsers } from '@tabler/icons-react';

interface StatsProps {
  stats: {
    totalRevenue: number;
    totalPayments: number;
    averagePayment: number;
    thisMonthRevenue: number;
    thisMonthCount: number;
  };
}

export default function PaymentStats({ stats }: StatsProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <IconCash className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPayments}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <IconReceipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Average */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Payment</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.averagePayment)}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <IconTrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Monthly */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(stats.thisMonthRevenue)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.thisMonthCount} payments
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <IconUsers className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
    </div>
  );
}