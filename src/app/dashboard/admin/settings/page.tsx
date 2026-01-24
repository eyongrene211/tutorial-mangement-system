'use client';

import { useState, useEffect } from 'react';
import { useUser }             from '@clerk/nextjs';
import toast, { Toaster }      from 'react-hot-toast';
import { DashboardLayout }     from '@/components/layout/dashboard-layout';
import {
  IconSettings,
  IconUser,
  IconSchool,
  IconBell,
  IconPalette,
  IconDeviceFloppy,
  IconRefresh,
} from '@tabler/icons-react';

interface Settings {
  _id: string;
  userId: string;
  centerName: string;
  centerEmail: string;
  centerPhone: string;
  centerAddress: string;
  subjects: string[];
  classLevels: string[];
  academicYear: string;
  currency: string;
  defaultPaymentAmount: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  gradingScale: string;
  passingGrade: number;
  dateFormat: string;
  timeFormat: string;
  language: string;
}

type TabType = 'profile' | 'center' | 'academic' | 'system';

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [formData, setFormData] = useState({
    centerName: '',
    centerEmail: '',
    centerPhone: '',
    centerAddress: '',
    subjects: [] as string[],
    classLevels: [] as string[],
    academicYear: '',
    currency: 'FCFA',
    defaultPaymentAmount: 20000,
    emailNotifications: true,
    smsNotifications: false,
    gradingScale: 'percentage',
    passingGrade: 50,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    language: 'en',
  });

  const [newSubject, setNewSubject] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('');

  const loggedInUserName = clerkUser
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin';

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      setSettings(data.settings);
      setFormData({
        centerName: data.settings.centerName || '',
        centerEmail: data.settings.centerEmail || '',
        centerPhone: data.settings.centerPhone || '',
        centerAddress: data.settings.centerAddress || '',
        subjects: data.settings.subjects || [],
        classLevels: data.settings.classLevels || [],
        academicYear: data.settings.academicYear || '',
        currency: data.settings.currency || 'FCFA',
        defaultPaymentAmount: data.settings.defaultPaymentAmount || 20000,
        emailNotifications: data.settings.emailNotifications ?? true,
        smsNotifications: data.settings.smsNotifications ?? false,
        gradingScale: data.settings.gradingScale || 'percentage',
        passingGrade: data.settings.passingGrade || 50,
        dateFormat: data.settings.dateFormat || 'DD/MM/YYYY',
        timeFormat: data.settings.timeFormat || '24h',
        language: data.settings.language || 'en',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully! ✅');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset settings
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;

    try {
      setSaving(true);

      const response = await fetch('/api/settings', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset settings');
      }

      toast.success('Settings reset to default! ✅');
      fetchSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  // Add subject
  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    if (formData.subjects.includes(newSubject.trim())) {
      toast.error('Subject already exists');
      return;
    }
    setFormData({
      ...formData,
      subjects: [...formData.subjects, newSubject.trim()],
    });
    setNewSubject('');
  };

  // Remove subject
  const handleRemoveSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter(s => s !== subject),
    });
  };

  // Add class level
  const handleAddClassLevel = () => {
    if (!newClassLevel.trim()) return;
    if (formData.classLevels.includes(newClassLevel.trim())) {
      toast.error('Class level already exists');
      return;
    }
    setFormData({
      ...formData,
      classLevels: [...formData.classLevels, newClassLevel.trim()],
    });
    setNewClassLevel('');
  };

  // Remove class level
  const handleRemoveClassLevel = (level: string) => {
    setFormData({
      ...formData,
      classLevels: formData.classLevels.filter(l => l !== level),
    });
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'User Profile', icon: IconUser },
    { id: 'center' as TabType, label: 'Tutorial Center', icon: IconSchool },
    { id: 'academic' as TabType, label: 'Academic Settings', icon: IconSettings },
    { id: 'system' as TabType, label: 'System Preferences', icon: IconPalette },
  ];

  if (loading) {
    return (
      <DashboardLayout userName={loggedInUserName} role="admin">
        <div className="flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout userName={loggedInUserName} role="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your tutorial center settings and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <IconRefresh className="w-5 h-5" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <IconDeviceFloppy className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {/* User Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Profile</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Your profile is managed by Clerk. You can update your profile information in your account settings.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={clerkUser?.fullName || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={clerkUser?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tutorial Center Tab */}
            {activeTab === 'center' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tutorial Center Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Center Name *
                    </label>
                    <input
                      type="text"
                      value={formData.centerName}
                      onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                      placeholder="e.g., Excellence Tutorial Center"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.centerEmail}
                      onChange={(e) => setFormData({ ...formData, centerEmail: e.target.value })}
                      placeholder="center@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.centerPhone}
                      onChange={(e) => setFormData({ ...formData, centerPhone: e.target.value })}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      placeholder="2025-2026"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.centerAddress}
                    onChange={(e) => setFormData({ ...formData, centerAddress: e.target.value })}
                    rows={3}
                    placeholder="Full address of your tutorial center"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Academic Settings Tab */}
            {activeTab === 'academic' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Academic Configuration</h3>
                </div>

                {/* Subjects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subjects
                  </label>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                      placeholder="Add new subject"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddSubject}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{subject}</span>
                        <button
                          onClick={() => handleRemoveSubject(subject)}
                          className="hover:text-red-600 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Class Levels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class Levels
                  </label>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={newClassLevel}
                      onChange={(e) => setNewClassLevel(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddClassLevel()}
                      placeholder="Add new class level"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddClassLevel}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.classLevels.map((level) => (
                      <span
                        key={level}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{level}</span>
                        <button
                          onClick={() => handleRemoveClassLevel(level)}
                          className="hover:text-red-600 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grading */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grading Scale
                    </label>
                    <select
                      value={formData.gradingScale}
                      onChange={(e) => setFormData({ ...formData, gradingScale: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (0-100)</option>
                      <option value="gpa">GPA (0-4.0)</option>
                      <option value="letter">Letter Grades (A-F)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Passing Grade (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingGrade}
                      onChange={(e) => setFormData({ ...formData, passingGrade: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Payment Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.defaultPaymentAmount}
                      onChange={(e) => setFormData({ ...formData, defaultPaymentAmount: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* System Preferences Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Preferences</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={formData.dateFormat}
                      onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={formData.timeFormat}
                      onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emailNotifications}
                        onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Receive notifications via email</div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.smsNotifications}
                        onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">SMS Notifications</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Receive notifications via SMS</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
