'use client';

import { UserButton }          from '@clerk/nextjs';
import { ThemeToggle }         from '../theme-toggle';
import { IconBell, IconMenu2 } from '@tabler/icons-react';

interface HeaderProps {
  userName: string;
  role: string;
  onMenuClick: () => void;
}

export function Header({ userName, role, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 right-0 left-0 lg:left-64 z-30">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Mobile menu button + Search */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <IconMenu2 className="w-6 h-6" />
          </button>
          
          {/* Search (hidden on mobile) */}
          <div className="hidden md:block">
            <input
              type="search"
              placeholder="Search..."
              className="w-64 px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right: Notifications, Theme Toggle, User */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <IconBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Info (hidden on small mobile) */}
          <div className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {role}
              </p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>

          {/* Mobile: Just user button */}
          <div className="sm:hidden">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}