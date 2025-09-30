'use client';

import { useState } from 'react';
import { useRegisterUserMutation } from '@/features/authApi';
import { useRouter } from 'next/navigation';

export default function UserRegister({ setStep, setEmailForVerify }) {
  const [userStep, setUserStep] = useState('register'); // 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [registerUser, { isLoading: isUserLoading, isError: isUserError, error: userError }] = useRegisterUserMutation();
  const router = useRouter();

  // Handle User Registration
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: String(data.phone || ''),
      address: data.address,
    };

    try {
      await registerUser(payload).unwrap();
      setEmailForVerify(data.email);
      setUserStep('verify');
      setStep('verify'); // Update parent step
      if (form && typeof form.reset === 'function') form.reset();
    } catch (err) {
      console.error('User registration error:', err);
      alert(err?.data?.message || err?.data?.error || 'Failed to create user account. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-xl">
      <div className="bg-gradient-to-br from-blue-50 via-orange-50 p-6 sm:p-8 rounded-lg shadow-sm">
        {userStep === 'register' && (
          <>
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Create User Account
              </h2>
              <p className="text-gray-600">
                Create your personal account to get started
              </p>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+92 3xx xxxxxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-12"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-12"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg mt-4 disabled:opacity-60"
                disabled={isUserLoading}
              >
                {isUserLoading ? 'Creating Account…' : 'Create User Account'}
              </button>

              {isUserError && (
                <p className="text-red-500 mt-4">
                  {userError?.data?.message || userError?.data?.error || 'Registration failed'}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}