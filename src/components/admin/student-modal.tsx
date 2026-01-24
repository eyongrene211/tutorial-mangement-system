'use client';

import { useState, useEffect } from 'react';
import { IconX }               from '@tabler/icons-react';
import toast                   from 'react-hot-toast';

interface ParentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  classLevel: string;
  parentUser?: string;
  parentInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  address?: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  notes?: string;
}

interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onSave: () => void;
}

export function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female',
    classLevel: 'Form 1',
    linkExistingParent: false,
    parentUserId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    photoUrl: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const [parents, setParents] = useState<ParentUser[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const classLevels = [
    'Form 1',
    'Form 2',
    'Form 3',
    'Form 4',
    'Form 5',
    'Lower Sixth',
    'Upper Sixth',
  ];

  useEffect(() => {
    fetchParents();

    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth.split('T')[0],
        gender: student.gender,
        classLevel: student.classLevel,
        linkExistingParent: !!student.parentUser,
        parentUserId: student.parentUser || '',
        parentName: student.parentInfo.name,
        parentPhone: student.parentInfo.phone,
        parentEmail: student.parentInfo.email || '',
        address: student.address || '',
        photoUrl: student.photoUrl || '',
        status: student.status,
        notes: student.notes || '',
      });
    }
  }, [student]);

  const fetchParents = async () => {
    try {
      setLoadingParents(true);
      const response = await fetch('/api/users?role=parent');
      const data = await response.json();

      if (response.ok) {
        const parentsArray = Array.isArray(data) ? data : data.users || [];
        setParents(parentsArray);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoadingParents(false);
    }
  };

  const handleParentSelect = (parentId: string) => {
    if (!parentId) {
      setFormData({
        ...formData,
        parentUserId: '',
        linkExistingParent: false,
      });
      return;
    }

    const selectedParent = parents.find((p) => p._id === parentId);
    if (selectedParent) {
      setFormData({
        ...formData,
        parentUserId: parentId,
        parentName: `${selectedParent.firstName} ${selectedParent.lastName}`,
        parentEmail: selectedParent.email,
        parentPhone: selectedParent.phone || '',
        linkExistingParent: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.parentName || !formData.parentPhone) {
        setError('Parent name and phone are required');
        setLoading(false);
        return;
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        classLevel: formData.classLevel,
        parentUserId: formData.linkExistingParent && formData.parentUserId ? formData.parentUserId : null,
        parentInfo: {
          name: formData.parentName,
          phone: formData.parentPhone,
          email: formData.parentEmail || undefined,
        },
        address: formData.address || undefined,
        photoUrl: formData.photoUrl || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      console.log('📤 Sending payload:', payload);

      const url = student ? `/api/students/${student._id}` : '/api/students';
      const method = student ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log('📥 Received response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save student');
      }

      // ✅ Check if parent account was created
      if (data.parentAccount) {
        const { username, email, tempPassword, message } = data.parentAccount;
        
        // Show detailed success message with credentials
        toast.success(
          (t) => (
            <div className="max-w-md">
              <p className="font-bold text-green-600 mb-2">✅ Student Created Successfully!</p>
              <p className="text-sm mb-3 text-gray-700">{message}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  📋 Parent Account Credentials:
                </p>
                <p className="text-sm"><strong>Username:</strong> {username}</p>
                <p className="text-sm"><strong>Email:</strong> {email}</p>
                <p className="text-sm"><strong>Password:</strong> {tempPassword}</p>
              </div>
              <p className="text-xs mt-2 text-red-600 font-semibold">
                ⚠️ IMPORTANT: Copy these credentials now! They won&apos;t be shown again.
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Parent Login Credentials:\nUsername: ${username}\nEmail: ${email}\nPassword: ${tempPassword}`
                  );
                  toast.success('Credentials copied to clipboard!');
                }}
                className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                📋 Copy Credentials
              </button>
            </div>
          ),
          { duration: 20000, position: 'top-center' }
        );
      } else {
        toast.success(
          student ? 'Student updated successfully! ✅' : 'Student created successfully! ✅'
        );
      }

      onSave();
    } catch (err) {
      console.error('❌ Error saving student:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error(err instanceof Error ? err.message : 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleBackdropClick}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {student ? 'Edit Student' : 'Add New Student'}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={loading}
            >
              <IconX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Student Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Student Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
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
                    Last Name <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    disabled={loading}
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={loading}
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={loading}
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    {classLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {student && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      disabled={loading}
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address (Optional)
                </label>
                <textarea
                  disabled={loading}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                  placeholder="Student address"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  disabled={loading}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                  placeholder="Additional notes about the student..."
                />
              </div>
            </div>

            {/* Parent Information */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Parent/Guardian Information
              </h3>

              {/* Link Existing Parent Option */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link to Existing Parent User (Optional)
                </label>
                <select
                  value={formData.parentUserId}
                  onChange={(e) => handleParentSelect(e.target.value)}
                  disabled={loading || loadingParents}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">-- Create New Parent Account --</option>
                  {parents.map((parent) => (
                    <option key={parent._id} value={parent._id}>
                      {parent.firstName} {parent.lastName} - {parent.email}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  💡 Leave blank to auto-create a parent account with login credentials
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading || formData.linkExistingParent}
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Parent full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={loading || formData.linkExistingParent}
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Email (Recommended for login)
                  </label>
                  <input
                    type="email"
                    disabled={loading || formData.linkExistingParent}
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="parent@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    💡 Provide email to create a proper login account for the parent
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{student ? 'Update Student' : 'Create Student'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
