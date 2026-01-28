'use client';

import { motion } from 'framer-motion';

interface TwoFactorFormProps {
  code: string;
  error: string;
  loading: boolean;
  isLoaded: boolean;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function TwoFactorForm({
  code,
  error,
  loading,
  isLoaded,
  onCodeChange,
  onSubmit,
  onBack,
}: TwoFactorFormProps) {
  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Error Message */}
      {error && (
        <motion.div
          className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </motion.div>
      )}

      <div className="bg-purple-50 border-l-4 border-purple-500 text-purple-700 px-4 py-3 rounded-lg text-sm">
        <p className="font-semibold mb-1">🔐 Two-Factor Authentication Required</p>
        <p>Enter the 6-digit code from your authenticator app</p>
      </div>

      {/* 2FA Code Field */}
      <div>
        <label htmlFor="twoFactorCode" className="block text-sm font-semibold text-gray-700 mb-2">
          Authentication Code
        </label>
        <input
          id="twoFactorCode"
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
          required
          maxLength={6}
          className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm text-gray-800 text-center text-2xl tracking-widest font-mono"
          placeholder="000000"
          autoFocus
          autoComplete="one-time-code"
        />
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading || !isLoaded || code.length < 6}
        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative flex items-center justify-center">
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying...
            </>
          ) : (
            <>
              Verify & Sign In
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </>
          )}
        </span>
      </motion.button>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium"
      >
        ← Back to sign in
      </button>
    </motion.form>
  );
}
