'use client';

import { useAuth, useSignIn }   from '@clerk/nextjs';
import { useRouter }            from 'next/navigation';
import { useState, useEffect }  from 'react';
import { LoginForm }            from '@/components/auth/LoginForm';
import { LoadingSpinner }       from '@/components/auth/LoadingSpinner';
import { ErrorMessage }         from '@/components/auth/ErrorMessage';
import { EduTrackIllustration } from '@/components/auth/EduTrackIllustration';

export default function SignInPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  if (!authLoaded || isSignedIn) {
    return <LoadingSpinner />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await new Promise(resolve => setTimeout(resolve, 300));
        window.location.href = '/dashboard';
      } else {
        setError('Please verify your account or contact support.');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const clerkError = error as { errors?: Array<{ message?: string }> };
        const errorMessage = clerkError.errors?.[0]?.message || 'Invalid credentials';
        setError(errorMessage);
      } else {
        setError('Wrong email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 overflow-hidden">
      {/* Role-based animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex flex-col lg:flex-row w-full relative z-10">
        {/* Left side - Enhanced branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-lg">
            <EduTrackIllustration />
            
            <div className="mt-12">
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-teal-900 bg-clip-text text-transparent mb-6 leading-tight">
                EduTrack Pro
              </h1>
              <p className="text-xl text-gray-600 mb-8 font-medium leading-relaxed">
                Professional tutorial center management system
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-2xl flex items-center justify-center mt-0.5 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <p className="ml-4 text-lg text-gray-700 font-medium">Real-time attendance tracking</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-600 rounded-2xl flex items-center justify-center mt-0.5 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <p className="ml-4 text-lg text-gray-700 font-medium">Secure payment management</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-600 rounded-2xl flex items-center justify-center mt-0.5 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <p className="ml-4 text-lg text-gray-700 font-medium">Parent progress insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 lg:p-10">
              {/* 🎨 MATCHING SIDEBAR LOGO HEADER */}
              <div className="text-center mb-10">
                <div className="mx-auto relative w-20 h-20 bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl mb-6 p-4">
                  <svg className="w-14 h-14 drop-shadow-lg" viewBox="0 0 80 80" fill="none">
                    <defs>
                      <linearGradient id="loginGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6"/>
                        <stop offset="50%" stopColor="#7c3aed"/>
                        <stop offset="100%" stopColor="#6d28d9"/>
                      </linearGradient>
                      <linearGradient id="loginShine" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    
                    <circle cx="40" cy="40" r="36" fill="url(#loginGradient)"/>
                    <circle cx="40" cy="40" r="36" fill="url(#loginShine)"/>
                    
                    <g transform="translate(40, 40)">
                      <path d="M -16 -8 Q -16 -4 -16 0 Q -16 4 -12 6 L -4 8 L -4 -10 L -12 -12 Q -16 -10 -16 -8 Z" fill="#ffffff" opacity="0.95"/>
                      <path d="M 16 -8 Q 16 -4 16 0 Q 16 4 12 6 L 4 8 L 4 -10 L 12 -12 Q 16 -10 16 -8 Z" fill="#ffffff" opacity="0.95"/>
                      <rect x="-1" y="-12" width="2" height="20" fill="#ffffff" opacity="0.85"/>
                      <circle cx="14" cy="12" r="6" fill="#10b981"/>
                      <path d="M 11 12 L 13 14 L 17 10" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                  </svg>
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                  Welcome to EduTrack
                </h2>
                <p className="text-gray-600 text-lg font-medium">
                  Sign in to access your dashboard
                </p>
              </div>

              <ErrorMessage error={error} />

              <LoginForm
                email={email}
                password={password}
                error={error}
                loading={loading}
                isLoaded={isLoaded}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onSubmit={handleSubmit}
              />

              <div className="mt-8 pt-8 border-t border-gray-200/50">
                <p className="text-center text-sm text-gray-500">
                  Need an account? Contact your administrator
                </p>
              </div>
            </div>

            {/* Mobile branding */}
            <div className="lg:hidden mt-8 text-center">
              <div className="inline-flex items-center space-x-2 text-purple-900 font-semibold mb-1">
                <svg className="w-5 h-5" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="36" fill="#8b5cf6"/>
                </svg>
                <span>EduTrack Pro</span>
              </div>
              <p className="text-gray-600 text-sm">Tutorial Center Management</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
