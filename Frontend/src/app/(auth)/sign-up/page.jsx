'use client';

import Link from 'next/link';
import { useState } from 'react';
import CompanyRegister from './CompanyRegister';
import UserRegister from './UserRegister';
import { useRouter } from 'next/navigation';
import { useVerifyEmailMutation } from '@/features/authApi';

export default function RegisterPage() {
  const [registerType, setRegisterType] = useState('company'); // 'company' | 'user'
  const [step, setStep] = useState('register'); // 'register' | 'verify' | 'verified'
  const [emailForVerify, setEmailForVerify] = useState('');
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const router = useRouter();

  // Handle Verification
  const handleVerify = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = emailForVerify || String(fd.get('verifyEmail') || '').trim();
    const otp = String(fd.get('otp') || '').trim();

    if (!email) {
      alert('Please enter your email.');
      return;
    }
    if (!/^\d{5}$/.test(otp)) {
      alert('Please enter a valid 5-digit code.');
      return;
    }

    try {
      await verifyEmail({ email, otp }).unwrap();
      setStep('verified');
    } catch (err) {
      console.error('Verify error:', err);
      alert(err?.data?.message || err?.data?.error || 'Verification failed. Please check your code and try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column (branding) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-orange-50 via-orange-50 flex-col items-center justify-center p-12">
        <div className="text-center">
          <h2 className="text-xl mb-4 text-gray-800">
            Sign in to your Alpha AutoMotive account
          </h2>
          <p className="text-2xl font-bold text-amber-600">
            Secure & Protected
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-1/2 p-6 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {step === 'register' && (
            <>
              <div className="text-center md:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Create Account
                </h2>
                <p className="text-gray-600">
                  Choose the type of account you want to create
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={() => setRegisterType('company')}
                    className={`px-4 py-2 rounded-lg ${registerType === 'company' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Company Registration
                  </button>
                  <button
                    onClick={() => setRegisterType('user')}
                    className={`px-4 py-2 rounded-lg ${registerType === 'user' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    User Registration
                  </button>
                </div>
              </div>

              {registerType === 'company' ? (
                <CompanyRegister setStep={setStep} setEmailForVerify={setEmailForVerify} />
              ) : (
                <UserRegister setStep={setStep} setEmailForVerify={setEmailForVerify} />
              )}

              <p className="text-center text-sm mt-4">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-red-600 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === 'verify' && (
            <div className="bg-gradient-to-br from-blue-50 via-orange-50 p-6 sm:p-8 rounded-lg shadow-sm">
              <div className="text-center md:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Verify your email
                </h2>
                <p className="text-gray-600">
                  {emailForVerify ? (
                    <>
                      We sent a 5-digit code to{' '}
                      <span className="font-medium">{emailForVerify}</span>.
                    </>
                  ) : (
                    <>Enter your email and the 5-digit code we sent.</>
                  )}
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="verifyEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={emailForVerify}
                    onChange={(e) => setEmailForVerify(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    required
                    readOnly={!!emailForVerify} // Make read-only if emailForVerify is set
                    disabled={!!emailForVerify} // Disable input if emailForVerify is set
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{5}"
                    placeholder="Enter the 5-digit code"
                    className="tracking-widest text-center text-xl w-full px-4 py-3 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter 5 digits (0–9).
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg mt-2 disabled:opacity-60"
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifying…' : 'Verify'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="w-full text-gray-600 hover:underline font-medium mt-2"
                >
                  Go back
                </button>
              </form>
            </div>
          )}

          {step === 'verified' && (
            <div className="bg-gradient-to-br from-blue-50 via-orange-50 p-6 sm:p-8 rounded-lg shadow-sm">
              <div className="text-center space-y-4 py-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Email verified 🎉
                </h2>
                <p className="text-gray-700">
                  Thanks for verifying your email. Your account is under review.
                  You’ll be able to log in soon.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}