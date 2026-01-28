'use client';

import { useClerk }                                                                 from '@clerk/nextjs';
import { ThemeToggle }                                                              from '../theme-toggle';
import { IconBell, IconMenu2, IconLogout, IconChevronDown, IconUser, IconSettings } from '@tabler/icons-react';
import { useRouter }                                                                from 'next/navigation';
import { useState, useRef, useEffect }                                              from 'react';

interface HeaderProps {
  userName: string;
  role: string;
  onMenuClick: () => void;
}

export function Header({ userName, role, onMenuClick }: HeaderProps) {
  const { signOut } = useClerk();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
  setDropdownOpen(false);
  setSigningOut(true);
  
  try {
    // Sign out from Clerk
    await signOut();
    
    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
    }
    
    // Force hard redirect to sign-in page
    window.location.href = '/sign-in';
  } catch (error) {
    console.error('Sign out error:', error);
    // Even if there's an error, redirect to sign-in
    window.location.href = '/sign-in';
  }
};


  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 right-0 left-0 lg:left-64 z-30">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Mobile menu button + Search */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IconMenu2 className="w-6 h-6" />
          </button>
          
          {/* Search (hidden on mobile) */}
          <div className="hidden md:block">
            <input
              type="search"
              placeholder="Search..."
              className="w-64 px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Right: Notifications, Theme Toggle, User Dropdown */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <IconBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Dropdown (Desktop & Mobile) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {/* User Info (hidden on small mobile) */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {role}
                </p>
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {getInitials(userName)}
              </div>

              {/* Dropdown Arrow */}
              <IconChevronDown 
                className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info in Dropdown (Mobile) */}
                <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {role}
                  </p>
                </div>

                {/* Menu Items */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/dashboard/profile');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <IconUser className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    View Profile
                  </span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/dashboard/settings');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <IconSettings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Settings
                  </span>
                </button>

                <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signingOut ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Signing out...
                      </span>
                    </>
                  ) : (
                    <>
                      <IconLogout className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Sign Out
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
