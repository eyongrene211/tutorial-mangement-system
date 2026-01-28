'use client';

import { useState, useEffect }                          from 'react';
import { DashboardLayout }                              from '@/components/layout/dashboard-layout';
import { IconLink, IconSearch, IconCheck, IconRefresh } from '@tabler/icons-react';
import { useUser }                                      from '@clerk/nextjs';
import { showToast }                                    from '@/components/ui/toast';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
  parentInfo: {
    email?: string;
    phone?: string;
  };
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  studentId?: string;
  clerkUserId: string;
}

export default function LinkParentPage() {
  const { user } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, usersRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/users'),
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        // Only show parent users
        setUsers(usersData.filter((u: User) => u.role === 'parent'));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncClerkUsers = async () => {
    if (!confirm('Sync all Clerk users to database? This will create database records for any Clerk users not yet synced.')) {
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('/api/admin/sync-clerk-users', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message, 'success');
        fetchData();
      } else {
        showToast(`Sync failed: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Failed to sync users:', error);
      showToast('Error syncing users', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const fixUserRoles = async () => {
    if (!confirm('Fix user roles from Clerk metadata?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/fix-user-roles', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message, 'success');
        fetchData();
      } else {
        showToast('Fix failed', 'error');
      }
    } catch (error) {
      console.error('Failed to fix roles:', error);
      showToast('Error fixing roles', 'error');
    }
  };

  const linkParentToStudent = async (
    parentUserId: string,
    studentId: string,
    parentClerkId: string,
    parentEmail: string,
    parentFirstName: string,
    parentLastName: string
  ) => {
    try {
      setLinking(true);

      // Update MongoDB user
      const response = await fetch(`/api/users/${parentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: parentEmail,
          firstName: parentFirstName,
          lastName: parentLastName,
          role: 'parent',
          studentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user in database');
      }

      // Update Clerk metadata
      const clerkResponse = await fetch('/api/admin/update-clerk-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: parentClerkId,
          metadata: { role: 'parent', studentId },
        }),
      });

      if (clerkResponse.ok) {
        showToast('Parent linked to student successfully!', 'success');
        fetchData();
      } else {
        showToast('Updated database but failed to update Clerk. Parent may need to sign out and sign in again.', 'warning');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to link parent:', error);
      showToast(error instanceof Error ? error.message : 'Failed to link parent to student', 'error');
    } finally {
      setLinking(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout userName={fullName} role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Link Parents to Students
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Connect parent accounts to their children
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Fix Roles Button */}
            <button
              onClick={fixUserRoles}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Fix Roles
            </button>

            {/* Sync Button */}
            <button
              onClick={syncClerkUsers}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <IconRefresh className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Users'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">Total Students</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {students.length}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm text-purple-700 dark:text-purple-300">Parent Accounts</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
              {users.length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">Linked</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {users.filter((u) => u.studentId).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Students & Parent Linking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No students found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => {
                const linkedParent = users.find((u) => u.studentId === student._id);

                return (
                  <div key={student._id} className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Class: {student.classLevel}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Parent Email: {student.parentInfo?.email || 'Not provided'}
                        </p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Student ID:{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {student._id}
                            </code>
                          </p>
                        </div>
                      </div>

                      <div className="lg:ml-4">
                        {linkedParent ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <IconCheck className="w-5 h-5" />
                            <div className="text-left lg:text-right">
                              <p className="text-sm font-medium">Linked to:</p>
                              <p className="text-sm">
                                {linkedParent.firstName} {linkedParent.lastName}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {linkedParent.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-left lg:text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              No parent linked
                            </p>
                            {users.length === 0 ? (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                No parent accounts available. Click &quot;Sync Users&quot; above.
                              </p>
                            ) : (
                              <select
                                className="w-full lg:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const parent = users.find((u) => u._id === e.target.value);
                                    if (
                                      parent &&
                                      confirm(
                                        `Link ${parent.firstName} ${parent.lastName} to ${student.firstName} ${student.lastName}?`
                                      )
                                    ) {
                                      linkParentToStudent(
                                        parent._id,
                                        student._id,
                                        parent.clerkUserId,
                                        parent.email,
                                        parent.firstName,
                                        parent.lastName
                                      );
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                disabled={linking}
                              >
                                <option value="">Select Parent...</option>
                                {users.map((parent) => (
                                  <option key={parent._id} value={parent._id}>
                                    {parent.firstName} {parent.lastName} ({parent.email})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to link parents:
          </h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>If you don&apos;t see parent accounts, click &quot;Sync Users&quot; button</li>
            <li>If roles are incorrect, click &quot;Fix Roles&quot; button</li>
            <li>Find the student you want to link</li>
            <li>Select the parent account from the dropdown</li>
            <li>Confirm the linking</li>
            <li>Parent will see student data on next login</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}
