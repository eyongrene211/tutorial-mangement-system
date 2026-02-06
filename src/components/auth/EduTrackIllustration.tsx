'use client';

import { FC } from 'react';

export function EduTrackIllustration() {
  return (
    <div className="relative">
      <svg className="w-96 h-96 lg:w-[500px] lg:h-[500px] mx-auto" viewBox="0 0 400 400" fill="none">
        {/* Admin Purple background */}
        <defs>
          <radialGradient id="adminGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
            <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.1"/>
          </radialGradient>
          <radialGradient id="teacherGrad" cx="70%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3"/>
            <stop offset="70%" stopColor="#0d9488" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.1"/>
          </radialGradient>
          <radialGradient id="parentGrad" cx="30%" cy="70%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/>
            <stop offset="70%" stopColor="#d97706" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.1"/>
          </radialGradient>
        </defs>
        
        <circle cx="200" cy="120" r="100" fill="url(#adminGrad)"/>
        <circle cx="280" cy="200" r="80" fill="url(#teacherGrad)"/>
        <circle cx="120" cy="280" r="80" fill="url(#parentGrad)"/>
        
        {/* Main logo elements */}
        <g transform="translate(200, 200)">
          <path d="M -20 -10 Q -20 -5 -20 0 Q -20 5 -15 7 L -5 10 L -5 -12 L -15 -14 Q -20 -12 -20 -10 Z" fill="#8b5cf6" opacity="0.8"/>
          <path d="M 20 -10 Q 20 -5 20 0 Q 20 5 15 7 L 5 10 L 5 -12 L 15 -14 Q 20 -12 20 -10 Z" fill="#8b5cf6" opacity="0.8"/>
          <circle cx="25" cy="20" r="8" fill="#10b981"/>
          <path d="M 20 20 L 24 24 L 30 18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        
        {/* Floating metrics */}
        <rect x="280" y="320" width="16" height="24" rx="3" fill="#14b8a6" opacity="0.8"/>
        <rect x="300" y="315" width="16" height="30" rx="3" fill="#14b8a6" opacity="0.8"/>
        <rect x="320" y="320" width="16" height="24" rx="3" fill="#14b8a6" opacity="0.8"/>
      </svg>
      
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-teal-500/20 rounded-2xl blur-xl animate-pulse"/>
    </div>
  );
}
