'use client';

import { useUser }         from '@clerk/nextjs';
import { useState }        from 'react';
import { 
  IconUser, 
  IconBell, 
  IconShield, 
  IconPalette, 
  IconSettings,
  IconChevronRight 
} from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// Define UserRole to match your DashboardLayout expectations
type UserRole = 'admin' | 'teacher' | 'parent';

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState('profile');

  // Safely extract metadata for the DashboardLayout
  const userRole = (clerkUser?.publicMetadata?.role as UserRole) || 'admin';
  const userName = clerkUser?.firstName || 'User';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: IconUser },
    { id: 'notifications', label: 'Notifications', icon: IconBell },
    { id: 'security', label: 'Security', icon: IconShield },
    { id: 'appearance', label: 'Appearance', icon: IconPalette },
  ];

  return (
    <DashboardLayout userName={userName} role={userRole}>
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account configurations and system preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Vertical Navigation Sidebar for Settings */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'} />
                    {tab.label}
                  </div>
                  <IconChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
                </button>
              ))}
            </nav>
          </aside>

          {/* Settings Content Panel */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                      <IconUser size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">First Name</label>
                      <input
                        type="text"
                        defaultValue={clerkUser?.firstName || ''}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Last Name</label>
                      <input
                        type="text"
                        defaultValue={clerkUser?.lastName || ''}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Primary Email</label>
                      <input
                        type="email"
                        defaultValue={clerkUser?.primaryEmailAddress?.emailAddress || ''}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500">Email is managed via your Clerk account settings.</p>
                    </div>
                  </div>

                  <button className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-2.5 rounded-xl font-bold hover:shadow-lg hover:opacity-90 transition-all">
                    Save Changes
                  </button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                      <IconBell size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
                  </div>
                  <div className="space-y-3">
                    {['Email notifications', 'Push notifications', 'Monthly usage reports'].map((label, idx) => (
                      <label key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                        <input type="checkbox" defaultChecked={idx !== 2} className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 accent-indigo-600" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                      <IconShield size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security & Privacy</h2>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-2xl">
                    <p className="text-amber-800 dark:text-amber-400 text-sm leading-relaxed">
                      Your authentication and security (passwords, 2FA) are managed through <strong>Clerk</strong>. 
                      Clicking the button below will redirect you to your secure profile portal.
                    </p>
                  </div>
                  <button className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                    Manage Account Security
                  </button>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                      <IconPalette size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Interface Customization</h2>
                  </div>
                  <div className="p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Theme preferences (Dark/Light mode) are synchronized with your system. 
                      Use the quick-toggle in the top navigation bar to switch manually.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}