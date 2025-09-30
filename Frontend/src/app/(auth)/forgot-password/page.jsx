'use client';
import Link from 'next/link';
import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white-50">
      {/* Left Column */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-orange-50 via-orange-50  flex-col items-center justify-between p-12">
        <div className="w-full flex justify-center mb-4 pt-8">
          <Image src={landingPageImages.Logo} alt="Logo" priority />
        </div>
        <Image src={landingPageImages.Text} alt="Text" priority />
        <div className="text-center">
          <h2 className="text-xl mb-4 text-gray-800">
            We will send you a Reset link
          </h2>
          <p className="text-2xl font-bold text-amber-600">Reset in Seconds</p>
        </div>
        <div className="w-full flex justify-center pb-8">
          <Image src={landingPageImages.signInPic} alt="Social" />
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full md:w-1/2 p-6 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="md:hidden mb-8 text-center">
            <div className="flex justify-center mb-4">
              <Image src={landingPageImages.Logo} alt="Logo" priority />
            </div>
            <div className="flex justify-center mb-4">
              <Image
                src={landingPageImages.Text}
                alt="Text"
                width={150}
                height={30}
                priority
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl mb-4 text-gray-800">
                Reset your Alpha AutoMotive password
              </h2>
              <p className="text-xl font-bold text-amber-600">
                We'll help you recover it
              </p>
            </div>
          </div>

          {/* Forgot Password Form */}
          <div className="bg-gradient-to-br from-blue-50 via-orange-50 t w-full h p-6 sm:p-8 rounded-lg shadow-sm">
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Forgot Password
              </h2>
              <p className="text-gray-600">
                Enter your email to receive reset instructions
              </p>
            </div>

            <form className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg font-medium transition-colors mt-4"
              >
                FORGOT
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remembered your password?{' '}
                <Link
                  href="/login"
                  className="text-red-600 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
