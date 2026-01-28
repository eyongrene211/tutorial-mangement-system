'use client';

import { motion } from 'framer-motion';

interface VerificationFormProps {
  email: string;
  code: string;
  error: string;
  loading: boolean;
  isLoaded: boolean;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}

export function VerificationForm({
  email,
  code,
  error,
  loading,
  isLoaded,
  onCodeChange,
  onSubmit,
  onResend,
  onBack,
}: VerificationFormProps) {
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

      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded-lg text-sm">
        <p className="font-semibold mb-1">Check your email!</p>
        <p>We sent a verification code to <strong>{email}</strong></p>
      </div>

      {/* Code Field */}
      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          required
          maxLength={6}
          className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm text-gray-800 text-center text-2xl tracking-widest font-mono"
          placeholder="000000"
          autoFocus
        />
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading || !isLoaded || code.length < 6}
        className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
            'Verify & Sign In'
          )}
        </span>
      </motion.button>

      {/* Resend Code */}
      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Didn&apos;t receive the code? Resend
        </button>
      </div>

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
