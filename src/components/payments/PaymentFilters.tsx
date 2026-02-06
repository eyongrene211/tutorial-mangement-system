import { IconFilter } from '@tabler/icons-react';

interface PaymentFiltersProps {
  filters: {
    month: string;
    classLevel: string;
    studentId: string;
    paymentMethod: string;
  };
  setFilters: (filters: any) => void;
  isAdmin: boolean;
  students: any[];
  monthOptions: any[];
  classLevels: string[];
  paymentMethods: any[];
}

export default function PaymentFilters({
  filters,
  setFilters,
  isAdmin,
  students,
  monthOptions,
  classLevels,
  paymentMethods
}: PaymentFiltersProps) {
  
  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <IconFilter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
          <select
            value={filters.month}
            onChange={(e) => handleChange('month', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
          >
            <option value="all">All Months</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Method</label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => handleChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
          >
            <option value="all">All Methods</option>
            {paymentMethods.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
          <select
            value={filters.classLevel}
            onChange={(e) => handleChange('classLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
          >
            <option value="all">All Classes</option>
            {classLevels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student</label>
            <select
              value={filters.studentId}
              onChange={(e) => handleChange('studentId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
            >
              <option value="all">All Students</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}