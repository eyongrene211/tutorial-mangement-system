'use client';

import { useState, useEffect } from 'react';
import { IconX }               from '@tabler/icons-react';

interface UserModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'parent';
    phone?: string;
    address?: string;
    status: 'active' | 'inactive';
    studentId?: string | null;
  } | null;
  onClose: () => void;
  onSave: () => void;
}

export function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher' as 'admin' | 'teacher' | 'parent',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
    studentId: null as string | null,
    activationMethod: 'invitation' as 'invitation' | 'temporary' | 'manual',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (user) {
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        status: user.status,
        studentId: user.studentId || null,
        activationMethod: 'manual', // Editing doesn't need activation
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTempPassword('');
    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const payload = {
        name: fullName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        address: formData.address,
        status: formData.status,
        studentId: formData.studentId,
        activationMethod: formData.activationMethod,
      };

      console.log('========== MODAL SUBMIT DEBUG ==========');
      console.log('Editing User ID:', user?._id);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const url = user ? `/api/users/${user._id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';

      console.log('Request URL:', url);
      console.log('Request Method:', method);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('========== END MODAL DEBUG ==========');

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      // If temporary password was generated, show it
      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
        // Don't close modal yet - admin needs to see password
      } else {
        onSave();
      }
      
    } catch (err) {
      console.error('ERROR in modal submit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  // Close after admin sees temp password
  const handlePasswordAcknowledged = () => {
    setTempPassword('');
    onSave();
  };

  // If showing temporary password
  if (tempPassword) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                User Created Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Share this temporary password securely with the user
              </p>
            </div>

            {/* Password Display */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Temporary Password
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    alert('Password copied to clipboard!');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Copy
                </button>
              </div>
              <div className="font-mono text-lg font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-600">
                {tempPassword}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> This password will only be shown once. Make sure to save it securely before closing this dialog.
              </p>
            </div>

            <button
              onClick={handlePasswordAcknowledged}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              I&apos;ve Saved the Password
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user ? 'Edit User' : 'Add New User'}
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

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                disabled={!!user || loading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="john@example.com"
              />
              {user && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                required
                disabled={loading}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'teacher' | 'parent' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Student Selector - Only for Parents */}
            {formData.role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link to Student (Optional)
                </label>
                <select
                  disabled={loading}
                  value={formData.studentId || ''}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">No student linked (can link later)</option>
                  {/* TODO: Fetch students dynamically */}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can link this parent to a student later
                </p>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                disabled={loading}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="+237 6XX XXX XXX"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                disabled={loading}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Enter address"
              />
            </div>

            {/* Status (only when editing) */}
            {user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  disabled={loading}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            {/* Activation Method (only for new users) */}
            {!user && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Activation Method
                </label>
                <select
                  disabled={loading}
                  value={formData.activationMethod}
                  onChange={(e) => setFormData({ ...formData, activationMethod: e.target.value as 'invitation' | 'temporary' | 'manual' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="invitation">Send Email Invitation (Recommended)</option>
                  <option value="temporary">Generate Temporary Password</option>
                  <option value="manual">Create without login (link later)</option>
                </select>
                
                {/* Helper text for each option */}
                {formData.activationMethod === 'invitation' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    📧 User will receive an email to set their password
                  </p>
                )}
                {formData.activationMethod === 'temporary' && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    🔑 You&apos;ll see a temporary password to share with the user
                  </p>
                )}
                {formData.activationMethod === 'manual' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    👤 User account created without login credentials
                  </p>
                )}
              </div>
            )}

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
                  user ? 'Update User' : 'Create User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
