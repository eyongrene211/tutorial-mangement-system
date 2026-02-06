'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useUser }                                     from '@clerk/nextjs';
import toast, { Toaster }                              from 'react-hot-toast';
import { DashboardLayout }                             from '@/components/layout/dashboard-layout';
import { IconPlus, IconPencil, IconTrash, IconX }      from '@tabler/icons-react';

type UserRole = 'admin' | 'tutor' | 'parent';
type UserStatus = 'active' | 'inactive';

interface UserData {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  subjects?: string[];
  students?: string[]; // For parents - student IDs
  phone?: string;
  address?: string;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface FormDataType {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  subjects: string[];
  students: string[];
  phone: string;
  address: string;
  status: UserStatus;
}

export default function UsersManagementPage() {
  const { user: clerkUser } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [formData, setFormData] = useState<FormDataType>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'tutor',
    subjects: [],
    students: [],
    phone: '',
    address: '',
    status: 'active',
  });

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin';

  useEffect(() => {
    fetchUsers();
    fetchStudents();
    fetchSubjects();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      
      if (!response.ok) {
        console.error('Failed to fetch students:', response.status);
        setStudents([]);
        return;
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data.students && Array.isArray(data.students)) {
        setStudents(data.students);
      } else {
        console.error('Invalid students data format:', data);
        setStudents([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };


  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/settings/subjects');
      const data = await response.json();

      if (response.ok && data.subjects) {
        setSubjects(data.subjects);
      } else {
        setSubjects([
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'French',
          'Biology',
          'History',
          'Geography'
        ]);
      }
    } catch (error: unknown) {
      console.error('Error fetching subjects:', error);
      setSubjects([
        'Mathematics',
        'Physics',
        'Chemistry',
        'English',
        'French',
        'Biology',
        'History',
        'Geography'
      ]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const submitData = editingUser 
        ? formData 
        : { 
            ...formData, 
            clerkId: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      toast.success(
        editingUser 
          ? 'User updated successfully! ✅' 
          : 'User created successfully! 🎉'
      );
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error saving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      subjects: user.subjects || [],
      students: user.students || [],
      phone: user.phone || '',
      address: user.address || '',
      status: user.status || 'active',
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('User deleted successfully! 🗑️');
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  // --- Sync Users Without Clerk IDs ---
  const handleSyncToClerk = async () => {
    if (!confirm('Sync users without Clerk IDs? This will link MongoDB users to existing Clerk accounts by email.')) {
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('/api/admin/sync-users', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        // Fix: Use a specific type instead of 'any' for the filter
        interface SyncDetail { status: string }
        
        const noClerkCount = data.details.filter(
          (d: SyncDetail) => d.status === 'no_clerk_account'
        ).length;

        const message = `✅ Synced ${data.updated} users!${noClerkCount > 0 ? ` ${noClerkCount} users not found in Clerk.` : ''}`;
        toast.success(message);
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      // Fix: Use safe error checking instead of 'error: any'
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'tutor',
      subjects: [],
      students: [],
      phone: '',
      address: '',
      status: 'active',
    });
    setEditingUser(null);
  };

  const toggleSubject = (subject: string) => {
    setFormData((prev: FormDataType): FormDataType => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s: string) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const toggleStudent = (studentId: string) => {
    setFormData((prev: FormDataType): FormDataType => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter((s: string) => s !== studentId)
        : [...prev.students, studentId],
    }));
  };

  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev: FormDataType): FormDataType => {
      const updates: Partial<FormDataType> = { [field]: value };
      
      if (field === 'role' && value !== 'tutor') {
        updates.subjects = [];
      }
      
      if (field === 'role' && value !== 'parent') {
        updates.students = [];
      }
      
      return { ...prev, ...updates } as FormDataType;
    });
  };

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={loggedInUserName} role="admin">
        <div className="space-y-6">
          {/* Header */}
         <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage system users, roles, and permissions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSyncToClerk}
                disabled={syncing}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Sync to Clerk</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <IconPlus className="w-5 h-5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {users.length || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Tutors</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {users.filter((u: UserData) => u.role === 'tutor').length || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Parents</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {users.filter((u: UserData) => u.role === 'parent').length || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {users.filter((u: UserData) => u.role === 'admin').length || 0}
              </div>
            </div>
          </div>

          {/* Users Table - ESSENTIAL COLUMNS ONLY */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : (!users || users.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No users found. Click &quot;Add User&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    users.map((user: UserData) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : user.role === 'tutor'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4 transition-colors"
                            title="Edit user"
                          >
                            <IconPencil className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete user"
                          >
                            <IconTrash className="w-5 h-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('firstName', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('lastName', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Contact Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('email', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        required
                        disabled={!!editingUser}
                      />
                      {!editingUser && (
                        <p className="text-xs text-gray-500 mt-1">
                          User will sign up with this email address
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('phone', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        placeholder="+237 XXX XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          handleInputChange('address', e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                </div>

                {/* Role & Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Role & Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange('role', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                      >
                        <option value="tutor">Tutor</option>
                        <option value="parent">Parent</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange('status', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* TUTOR: Assign Subjects */}
                {formData.role === 'tutor' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Teaching Subjects
                    </h4>
                    {subjects.length === 0 ? (
                      <p className="text-sm text-gray-500">Loading subjects...</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        {subjects.map((subject: string) => (
                          <label key={subject} className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.subjects.includes(subject)}
                              onChange={() => toggleSubject(subject)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {subject}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Manage subjects from Settings → Subjects
                    </p>
                  </div>
                )}

                {/* PARENT: Assign Students */}
                {formData.role === 'parent' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Assign Students
                    </h4>
                    {students.length === 0 ? (
                      <div className="text-sm p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-300">
                          ⚠️ No students found in the system.
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                          Go to Students section to add students first, then come back to assign them to this parent.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-1">
                        {students.map((student: Student) => (
                          <label key={student._id} className="flex items-center space-x-3 p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.students.includes(student._id)}
                              onChange={() => toggleStudent(student._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.firstName} {student.lastName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                ({student.classLevel})
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Select which students belong to this parent
                    </p>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}