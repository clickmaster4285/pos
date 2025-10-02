'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useVerifyEmailMutation } from '@/features/authApi';
import landingPageImages from '@/public/images/landingPageImages';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      await verifyEmail({ email, otp }).unwrap();
      router.push('/sign-in');
    } catch (error) {
      setErrorMessage(
        error?.data?.message ||
          error?.message ||
          'Email verification failed. Please try again.'
      );
      console.error('Verification error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white-50">
      {/* Left Column */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-orange-50 via-orange-50 flex-col items-center justify-center gap-6 p-10">
        <div className="w-full flex justify-center">
          <h6>AutoMotive Industery</h6>
        </div>
        <div className="text-center">
          <h2 className="text-xl mb-2 text-gray-800 -mt-5">
            Verify your Alpha AutoMotive account
          </h2>
          <p className="text-2xl font-bold text-amber-600">
            Secure &amp; Protected
          </p>
        </div>
        <div className="w-full flex justify-center">
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
              <Image src={landingPageImages.ClickLogo} alt="Logo" priority />
            </div>
            <div className="flex justify-center mb-4">
              <Image src={landingPageImages.Text} alt="Text" priority />
            </div>
            <div className="text-center">
              <h2 className="text-xl mb-4 text-gray-800">
                Verify your Alpha AutoMotive account
              </h2>
              <p className="text-xl font-bold text-amber-600">
                Secure & Protected
              </p>
            </div>
          </div>

          {/* Verify Email Form */}
          <div className="bg-gradient-to-br from-blue-50 via-orange-50 to-white w-full p-6 sm:p-8 rounded-lg shadow-sm">
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Verify Email
              </h2>
              <p className="text-gray-600">Enter the OTP sent to your email</p>
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

              {/* OTP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP
                </label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <p className="text-red-600 text-sm">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg font-medium transition-colors mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <p className="text-center text-sm mt-6">
              Already verified?{' '}
              <Link
                href="/sign-in"
                className="text-red-600 hover:underline font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}