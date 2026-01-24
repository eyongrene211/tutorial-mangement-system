'use client';

import { IconAlertTriangle } from '@tabler/icons-react';

interface DeleteConfirmationProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmation({ userName, onConfirm, onCancel }: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <IconAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Delete User
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{userName}</span>? 
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
