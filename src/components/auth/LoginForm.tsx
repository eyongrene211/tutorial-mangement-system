'use client';

import { FC } from 'react';

interface LoginFormProps {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  isLoaded: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({ 
  email, password, error, loading, isLoaded, 
  onEmailChange, onPasswordChange, onSubmit 
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={loading || !isLoaded}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-gray-700 bg-white/50 backdrop-blur-sm text-lg placeholder-gray-500 shadow-sm"
          placeholder="admin@edutrack.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={loading || !isLoaded}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-gray-700 bg-white/50 backdrop-blur-sm text-lg placeholder-gray-500 shadow-sm"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !isLoaded}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transform disabled:scale-100 hover:scale-[1.02] transition-all duration-200 text-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <svg className="animate-spin -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Signing In...</span>
          </span>
        ) : (
          'Sign In to EduTrack'
        )}
      </button>
    </form>
  );
}
