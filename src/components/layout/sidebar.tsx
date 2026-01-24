'use client';

import Link            from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconUsers,
  IconUserCircle,
  IconCalendarEvent,
  IconCreditCard,
  IconCertificate,
  IconReportAnalytics,
  IconSettings,
  IconSchool,
  IconX,
} from '@tabler/icons-react';

interface SidebarProps {
  role: 'admin' | 'teacher' | 'parent';
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, userName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Role-based menu items
  const adminMenuItems = [
    { icon: IconLayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: IconUsers, label: 'User Management', href: '/dashboard/admin/users' },
    { icon: IconUserCircle, label: 'Students', href: '/dashboard/admin/students' },
    { icon: IconCalendarEvent, label: 'Attendance', href: '/dashboard/admin/attendance' },
    { icon: IconCreditCard, label: 'Payments', href: '/dashboard/admin/payments' },
    { icon: IconCertificate, label: 'Grades', href: '/dashboard/admin/grades' },
    { icon: IconReportAnalytics, label: 'Reports', href: '/dashboard/admin/reports' },
    { icon: IconSettings, label: 'Settings', href: '/dashboard/admin/settings' },
  ];

  const teacherMenuItems = [
    { icon: IconLayoutDashboard, label: 'Dashboard', href: '/dashboard/teacher' },
    { icon: IconUserCircle, label: 'Students', href: '/dashboard/teacher/students' },
    { icon: IconCalendarEvent, label: 'Attendance', href: '/dashboard/teacher/attendance' },
    { icon: IconCertificate, label: 'Grades', href: '/dashboard/teacher/grades' },
    { icon: IconReportAnalytics, label: 'Reports', href: '/dashboard/teacher/reports' },
  ];

  const parentMenuItems = [
    { icon: IconLayoutDashboard, label: 'Dashboard', href: '/dashboard/parent' },
    { icon: IconCalendarEvent, label: 'Attendance', href: '/dashboard/parent/attendance' },
    { icon: IconCertificate, label: 'Grades', href: '/dashboard/parent/grades' },
    { icon: IconCreditCard, label: 'Payments', href: '/dashboard/parent/payments' },
  ];

  const menuItems = 
    role === 'admin' ? adminMenuItems :
    role === 'teacher' ? teacherMenuItems :
    parentMenuItems;

  const roleColors = {
    admin: 'bg-admin-600',
    teacher: 'bg-teacher-600',
    parent: 'bg-parent-600',
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo + Close Button */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${roleColors[role]} rounded-lg flex items-center justify-center`}>
              <IconSchool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Excellence
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tutorial Center
              </p>
            </div>
          </Link>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            // Fixed active state logic - exact match or child route
            const isActive = pathname === item.href || 
              (pathname.startsWith(item.href + '/') && item.href !== '/dashboard/admin' && item.href !== '/dashboard/teacher' && item.href !== '/dashboard/parent');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? `${roleColors[role]} text-white`
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Badge */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className={`px-4 py-3 ${roleColors[role]} rounded-lg`}>
            <p className="text-white font-semibold text-sm truncate">
              {userName}
            </p>
            <p className="text-white/80 text-xs uppercase mt-1 font-medium">
              {role}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
