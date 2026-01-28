'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBgColor = 'bg-blue-100 dark:bg-blue-900/20',
  iconColor = 'text-blue-600 dark:text-blue-400'
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          {subtitle}
        </p>
      )}
    </div>
  );
}
