'use client';

import Link            from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard, IconUsers, IconUserCircle, IconCalendarEvent,
  IconCreditCard, IconCertificate, IconReportAnalytics, IconSettings,
  IconX, IconLink, IconReceipt
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
    { icon: IconLink, label: 'Link Parents', href: '/dashboard/admin/link-parent' },
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
    { icon: IconSettings, label: 'Settings', href: '/dashboard/teacher/settings' },
  ];

  const parentMenuItems = [
    { icon: IconLayoutDashboard, label: 'Dashboard', href: '/dashboard/parent' },
    { icon: IconCalendarEvent, label: 'Attendance', href: '/dashboard/parent/attendance' },
    { icon: IconReceipt, label: 'Payments', href: '/dashboard/parent/payments' }, // Payment route added for parent
    { icon: IconCertificate, label: 'Grades', href: '/dashboard/parent/grades' }
  ];

  const menuItems = role === 'admin' ? adminMenuItems : role === 'teacher' ? teacherMenuItems : parentMenuItems;

  // 🎨 ENHANCED ROLE-BASED COLORS (Purple theme as original)
  const roleColors = {
    admin: 'bg-purple-600',
    teacher: 'bg-teal-600', 
    parent: 'bg-amber-600',
  };

  const roleTextColors = {
    admin: 'text-purple-600 dark:text-purple-400',
    teacher: 'text-teal-600 dark:text-teal-400',
    parent: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 
        border-r border-gray-200 dark:border-gray-800 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        
        {/* 🎨 EDUTRACK LOGO - ROLE-BASED THEME (UNTOUCHED) */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3 hover:scale-[1.02] transition-transform group">
            {/* Enhanced Role-Based Logo */}
            <div className="relative">
              <svg className="w-14 h-14 drop-shadow-xl transition-transform group-hover:scale-105" viewBox="0 0 80 80" fill="none">
                <defs>
                  {/* Role-based gradients */}
                  <linearGradient id={`logoGradient-${role}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    {role === 'admin' ? (
                      <>
                        <stop offset="0%" stopColor="#8b5cf6"/>
                        <stop offset="50%" stopColor="#7c3aed"/>
                        <stop offset="100%" stopColor="#6d28d9"/>
                      </>
                    ) : role === 'teacher' ? (
                      <>
                        <stop offset="0%" stopColor="#14b8a6"/>
                        <stop offset="50%" stopColor="#0d9488"/>
                        <stop offset="100%" stopColor="#0f766e"/>
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="#f59e0b"/>
                        <stop offset="50%" stopColor="#d97706"/>
                        <stop offset="100%" stopColor="#b45309"/>
                      </>
                    )}
                  </linearGradient>
                  
                  <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                  </linearGradient>
                  
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                </defs>
                
                <circle cx="40" cy="40" r="36" fill={`url(#logoGradient-${role})`} filter="url(#shadow)"/>
                <circle cx="40" cy="40" r="36" fill="url(#shine)"/>
                
                <g transform="translate(40, 40)">
                  <path d="M -16 -8 Q -16 -4 -16 0 Q -16 4 -12 6 L -4 8 L -4 -10 L -12 -12 Q -16 -10 -16 -8 Z" 
                        fill="#ffffff" opacity="0.95"/>
                  <path d="M 16 -8 Q 16 -4 16 0 Q 16 4 12 6 L 4 8 L 4 -10 L 12 -12 Q 16 -10 16 -8 Z" 
                        fill="#ffffff" opacity="0.95"/>
                  <rect x="-1" y="-12" width="2" height="20" fill="#ffffff" opacity="0.85"/>
                  <circle cx="14" cy="12" r="6" fill="#10b981"/>
                  <path d="M 11 12 L 13 14 L 17 10" stroke="#ffffff" strokeWidth="1.5" 
                        fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <circle cx="12" cy="12" r="2" fill="#ffffff" opacity="0.2"/>
                <circle cx="68" cy="68" r="2" fill="#ffffff" opacity="0.2"/>
              </svg>
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                EduTrack
              </h1>
              <p className={`text-xs font-bold uppercase tracking-wider ${roleTextColors[role]}`}>
                Tutorial Center
              </p>
            </div>
          </Link>

          <button 
            onClick={onClose} 
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (pathname.startsWith(item.href + '/') && !['/dashboard/admin', '/dashboard/teacher', '/dashboard/parent'].includes(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? `${roleColors[role]} text-white shadow-md`
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className={`px-4 py-3 ${roleColors[role]} rounded-lg`}>
            <p className="text-white font-semibold text-sm truncate">{userName}</p>
            <p className="text-white/80 text-xs uppercase mt-1 font-medium">{role}</p>
          </div>
        </div>
      </aside>
    </>
  );
}