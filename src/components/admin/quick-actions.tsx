'use client';

import { useRouter } from 'next/navigation';
import {
  IconUserPlus,
  IconUsers,
  IconFileAnalytics,
  IconCalendarEvent,
  IconBook,
  IconSettings,
} from '@tabler/icons-react';

export function QuickActionsSection() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Add Student',
      description: 'Enroll a new student',
      icon: IconUserPlus,
      color: 'blue',
      action: () => router.push('/dashboard/admin/students'),
    },
    {
      title: 'Manage Users',
      description: 'Add teachers or parents',
      icon: IconUsers,
      color: 'green',
      action: () => router.push('/dashboard/admin/users'),
    },
    {
      title: 'View Reports',
      description: 'Generate analytics',
      icon: IconFileAnalytics,
      color: 'purple',
      action: () => router.push('/dashboard/admin/reports'),
    },
    {
      title: 'Take Attendance',
      description: 'Record daily attendance',
      icon: IconCalendarEvent,
      color: 'orange',
      action: () => router.push('/dashboard/admin/attendance'),
    },
    {
      title: 'Add Grades',
      description: 'Record student grades',
      icon: IconBook,
      color: 'pink',
      action: () => router.push('/dashboard/admin/grades'),
    },
    {
      title: 'Settings',
      description: 'Configure system',
      icon: IconSettings,
      color: 'gray',
      action: () => router.push('/dashboard/admin/settings'),
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; border: string; text: string }> = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-900 dark:text-blue-100',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-900 dark:text-green-100',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-900 dark:text-purple-100',
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-900 dark:text-orange-100',
      },
      pink: {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30',
        border: 'border-pink-200 dark:border-pink-800',
        text: 'text-pink-900 dark:text-pink-100',
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-900/30',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-900 dark:text-gray-100',
      },
    };

    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colors = getColorClasses(action.color);

          return (
            <button
              key={action.title}
              onClick={action.action}
              className={`p-4 ${colors.bg} ${colors.hover} rounded-lg border ${colors.border} transition-all text-left group hover:scale-105 transform duration-200`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.border} border`}
                >
                  <Icon className={`w-5 h-5 ${colors.text.replace('dark:text-', 'dark:text-').replace('-100', '-600').replace('dark:text-', 'dark:text-').replace('-100', '-400')}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${colors.text}`}>{action.title}</h3>
                  <p className={`text-sm mt-1 ${colors.text.replace('900', '700').replace('100', '300')}`}>
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
