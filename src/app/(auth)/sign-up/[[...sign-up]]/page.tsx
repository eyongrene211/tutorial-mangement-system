import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Create Account
        </h1>
        <SignUp />
      </div>
    </div>
  );
}