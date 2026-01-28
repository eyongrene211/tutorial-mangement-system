'use client';

import Link from 'next/link';
import { 
  IconUserPlus, 
  IconCalendarEvent, 
  IconCash, 
  IconFileText,
  IconUsers,
  IconClipboardList
} from '@tabler/icons-react';

export function QuickActionsSection() {
  const actions = [
    {
      title: 'Add Student',
      description: 'Register a new student',
      icon: IconUserPlus,
      href: '/dashboard/students',
      color: 'blue',
    },
    {
      title: 'Record Attendance',
      description: 'Mark today\'s attendance',
      icon: IconClipboardList,
      href: '/dashboard/attendance',
      color: 'green',
    },
    {
      title: 'Record Payment',
      description: 'Add a payment record',
      icon: IconCash,
      href: '/dashboard/payments',
      color: 'purple',
    },
    {
      title: 'Schedule Session',
      description: 'Create a new session',
      icon: IconCalendarEvent,
      href: '/dashboard/sessions',
      color: 'orange',
    },
    {
      title: 'View Reports',
      description: 'Check performance reports',
      icon: IconFileText,
      href: '/dashboard/reports',
      color: 'pink',
    },
    {
      title: 'Manage Parents',
      description: 'View parent accounts',
      icon: IconUsers,
      href: '/dashboard/parents',
      color: 'indigo',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30',
    pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/30',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/30',
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${colorClasses[action.color as keyof typeof colorClasses]}`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
