'use client';

import { useState } from 'react';
import { Sidebar }  from './sidebar';
import { Header }   from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  role: 'admin' | 'teacher' | 'parent';
}

export function DashboardLayout({ children, userName, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar 
              role={role} 
              userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Header */}
      <Header 
        userName={userName} 
        role={role}
        onMenuClick={() => setSidebarOpen(true)}
      />
      
      {/* Main Content */}
      <main className="lg:ml-64 mt-16 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}