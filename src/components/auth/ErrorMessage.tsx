import { FC } from 'react';

interface ErrorMessageProps {
  error: string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-red-200/50 rounded-xl shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 border-2 border-red-200 flex items-center justify-center mt-0.5">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
        </div>
        <p className="text-sm text-red-800 font-medium leading-relaxed flex-1">{error}</p>
      </div>
    </div>
  );
}
