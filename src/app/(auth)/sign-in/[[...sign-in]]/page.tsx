'use client';

import { useAuth, useSignIn }   from '@clerk/nextjs';
import { useRouter }            from 'next/navigation';
import { useState, useEffect }  from 'react';
import { motion }               from 'framer-motion';
import { TutorialIllustration } from '@/components/auth/TutorialIllustration';
import { LoginForm }            from '@/components/auth/LoginForm';

export default function SignInPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  // Show loading while checking auth
  if (!authLoaded || isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
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

      console.log('Sign-in status:', result.status);

      // With verification disabled, should go straight to complete
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Small delay for session sync
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Log the unexpected status
        console.error('Unexpected status:', result.status);
        console.error('Full result:', result);
        
        setError(
          `Sign-in requires additional verification. Please disable verification in Clerk Dashboard or contact your administrator. (Status: ${result.status})`
        );
      }
    } catch (error: unknown) {
      console.error('Sign-in error:', error);
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const clerkError = error as { errors?: Array<{ message?: string; code?: string }> };
        const errorMessage = clerkError.errors?.[0]?.message || 'Invalid email or password';
        const errorCode = clerkError.errors?.[0]?.code;
        
        console.error('Error code:', errorCode);
        setError(errorMessage);
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
        />
        <motion.div
          className="absolute top-1/4 -right-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/4 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
        />
      </div>

      {/* Left Side - Illustration & Info */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-lg">
          <TutorialIllustration />
          
          <motion.div
            className="mt-8 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TutorialMS
            </h2>
            <p className="text-xl text-gray-700 font-semibold">
              Afterschool Tutorial Management Made Easy
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Empowering secondary and high school students through organized, effective afterschool learning sessions
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 pt-4">
              <motion.div
                className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-indigo-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-sm font-medium text-indigo-700">📚 Session Tracking</span>
              </motion.div>
              <motion.div
                className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-sm font-medium text-purple-700">📊 Progress Reports</span>
              </motion.div>
              <motion.div
                className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-pink-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-sm font-medium text-pink-700">👨‍👩‍👧 Parent Portal</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="w-full max-w-md"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          {/* Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/40">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mb-5 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back!
              </h1>
              <p className="text-gray-600">
                Sign in to manage your tutorial sessions
              </p>
            </motion.div>

            {/* Login Form */}
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

            {/* Footer */}
            <motion.div
              className="mt-8 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/90 text-gray-600">Need help?</span>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600">
                Contact your administrator for account access or support
              </p>
            </motion.div>
          </div>

          {/* Mobile Brand */}
          <motion.div
            className="lg:hidden mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TutorialMS
            </h3>
            <p className="text-gray-600 text-sm mt-1">Afterschool Tutorial Management</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
