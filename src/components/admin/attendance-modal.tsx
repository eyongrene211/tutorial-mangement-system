'use client';

import { useState } from 'react';
import { IconX }    from '@tabler/icons-react';

interface AttendanceModalProps {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    classLevel: string;
  };
  date: string;
  currentStatus?: 'present' | 'absent' | 'late' | 'excused';
  currentNotes?: string;
  onClose: () => void;
  onSave: () => void;
}

export function AttendanceModal({ 
  student, 
  date, 
  currentStatus, 
  currentNotes,
  onClose, 
  onSave 
}: AttendanceModalProps) {
  const [status, setStatus] = useState<'present' | 'absent' | 'late' | 'excused'>(
    currentStatus || 'present'
  );
  const [notes, setNotes] = useState(currentNotes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id,
          date,
          status,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark attendance');
      }

      onSave();
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400', icon: '✅' },
    { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400', icon: '❌' },
    { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400', icon: '⏰' },
    { value: 'excused', label: 'Excused', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400', icon: '📝' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Mark Attendance
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={loading}
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Student Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {student.classLevel} • {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Attendance Status *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value as typeof status)}
                    disabled={loading}
                    className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                      status === option.value
                        ? option.color + ' font-semibold'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                disabled={loading}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Attendance'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
