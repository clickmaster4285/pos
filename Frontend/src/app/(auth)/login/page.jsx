'use client';
import { useState, useContext, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLoginMutation } from '@/features/authApi';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import { setCookie } from 'cookies-next';
import landingPageImages from '@/public/images/landingPageImages';

export default function SignInPage() {
  const router = useRouter();
  const authContext = useContext(AuthContext); // This might be undefined initially

  // Fallback if context is undefined
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (!authContext) {
      console.error(
        'AuthContext is undefined. Ensure AuthProvider wraps the app.'
      );
    }
  }, [authContext]);
  // put these above your component (or inside it before handleSubmit)

  // Normalize API response into { token, user, ... }
  const normalizeAuthResponse = (res) => {
    const token = res?.data?.token ?? res?.token ?? null;
    const user = res?.data?.user ?? res?.user ?? null;
    const success = res?.success ?? Boolean(token);
    return {
      token,
      user,
      success,
      requiresTwoFactor: res?.requiresTwoFactor,
      tempToken: res?.tempToken,
    };
  };

  // Decide where to go based on role (default → /dashboard)
const getDashboardPath = (role, subRole) => {
  const r = String(role || '').toLowerCase();
  const sr = String(subRole || '').toLowerCase();

  switch (r) {
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'staff':
      return sr ? `/staff/${sr}/dashboard` : '/staff/dashboard';
    case 'user':
      return '/user/dashboard';
    default:
      return '/unauthorized';
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage('');

  try {
    const raw = await login({ email, password }).unwrap();
    const { token, user, success, requiresTwoFactor, tempToken } =
      normalizeAuthResponse(raw);

    if (requiresTwoFactor && tempToken) {
      router.push(`/two-factor-auth?tempToken=${tempToken}`);
      return;
    }
    if (!success || !token) {
      setErrorMessage(raw?.message || 'Login failed');
      return;
    }

    // Persist auth (so Sidebar can read role & subRole later)
    try {
      // If you also use a token cookie:
      setCookie('authToken', token, { sameSite: 'lax' });
    } catch {}

    // Staff → /staff/<subRole>/dashboard
    const destination = getDashboardPath(user?.role, user?.subRole);
    router.replace(destination);
  } catch (error) {
    setErrorMessage(
      error?.data?.message ||
        error?.message ||
        'An error occurred. Please try again later.'
    );
    console.error('Login error:', error);
  }
};

  // Rest of your JSX remains unchanged
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white-50">
      {/* Left Column */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-orange-50 via-orange-50 flex-col items-center justify-center gap-6 p-10">
        <div className="w-full flex justify-center ">
          <h6>AutoMotive Industery</h6>
        </div>

        <div className="text-center">
          <h2 className="text-xl mb-2 text-gray-800 -mt-5">
            Sign in to your Alpha AutoMotive account
          </h2>
          <p className="text-2xl font-bold text-amber-600">
            Secure &amp; Protected
          </p>
        </div>

        <div className="w-full flex justify-center ">
          <Image
            src={landingPageImages.signInPic}
            alt="Social"
            className="max-w-[80%] h-auto"
          />
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full md:w-1/2 p-6 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="md:hidden mb-8 text-center">
            <div className="flex justify-center mb-4">
              <h6>AutoMotive Industery</h6>
            </div>
            <div className="flex justify-center mb-4">
              <Image src={landingPageImages.Text} alt="Text" priority />
            </div>
            <div className="text-center">
              <h2 className="text-xl mb-4 text-gray-800">
                Sign in to your Alpha AutoMotive account
              </h2>
              <p className="text-xl font-bold text-amber-600">
                Secure & Protected
              </p>
            </div>
          </div>

          {/* Sign In Form */}
          <div className="bg-gradient-to-br from-blue-50 via-orange-50 to-white w-full p-6 sm:p-8 rounded-lg shadow-sm">
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Sign In
              </h2>
              <p className="text-gray-600">Access your account</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 text-sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <p className="text-red-600 text-sm">{errorMessage}</p>
              )}

              {/* Forgot Password Link */}
              <div className="text-right text-sm">
                <Link
                  href="/forgot-password"
                  className="text-red-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg font-medium transition-colors mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <p className="text-center text-sm">
              Don't have an account?{' '}
              <Link
                href="/sign-up"
                className="text-red-600 hover:underline font-medium"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
