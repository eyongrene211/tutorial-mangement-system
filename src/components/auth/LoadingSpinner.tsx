import { FC } from 'react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50">
      <div className="text-center">
        <div className="mx-auto relative w-28 h-28 bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl mb-8 p-6 animate-pulse">
          <svg className="w-16 h-16 drop-shadow-lg" viewBox="0 0 80 80" fill="none">
            <defs>
              <linearGradient id="spinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6"/>
                <stop offset="50%" stopColor="#7c3aed"/>
                <stop offset="100%" stopColor="#6d28d9"/>
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="36" fill="url(#spinGradient)" opacity="0.9"/>
            <g transform="translate(40, 40)">
              <path d="M -16 -8 Q -16 -4 -16 0 Q -16 4 -12 6 L -4 8 L -4 -10 L -12 -12 Q -16 -10 -16 -8 Z" fill="#ffffff" opacity="0.95"/>
              <path d="M 16 -8 Q 16 -4 16 0 Q 16 4 12 6 L 4 8 L 4 -10 L 12 -12 Q 16 -10 16 -8 Z" fill="#ffffff" opacity="0.95"/>
              <circle cx="14" cy="12" r="6" fill="#10b981"/>
            </g>
          </svg>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-teal-900 bg-clip-text text-transparent">
            EduTrack Pro
          </h2>
          <p className="text-xl text-gray-600 font-medium">Loading your dashboard...</p>
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-teal-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-4 h-4 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
