'use client';

import { useState } from 'react';
import { useCreateCompanyMutation } from '@/features/CompanyApi';
import { useGetAllPlansQuery } from '@/features/planApi';
import { useRouter } from 'next/navigation';

export default function CompanyRegister({ setStep, setEmailForVerify }) {
  const [companyStep, setCompanyStep] = useState('company'); // 'company' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [planId, setPlanId] = useState('');
  const [companyData, setCompanyData] = useState({}); // Store company form data

  const [createCompany, { isLoading: isCompanyLoading, isError: isCompanyError, error: companyError }] = useCreateCompanyMutation();
  const { data: plans = [], isLoading: isPlansLoading, error: plansError } = useGetAllPlansQuery();
  const router = useRouter();

  // Handle Company Details Submission
  const handleCompanyDetailsSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!planId) {
      alert('Please select a plan');
      return;
    }

    setCompanyData({
      name: data.companyName,
      contactEmail: data.email,
      contactPhone: String(data.contactPhone || ''),
      address: data.address,
      plan: planId,
    });
    setCompanyStep('admin');
    if (form && typeof form.reset === 'function') form.reset();
  };

  // Handle Admin Details Submission
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    const payload = {
      company: companyData,
      admin: {
        name: data.adminName,
        email: data.adminEmail,
        phone: String(data.adminPhone || ''),
        address: data.adminAddress,
        password: data.password,
      },
    };

    try {
      await createCompany(payload).unwrap();
      setEmailForVerify(data.adminEmail);
      setCompanyStep('verify');
      setStep('verify'); // Update parent step
      if (form && typeof form.reset === 'function') form.reset();
      setPlanId('');
    } catch (err) {
      console.error('Company registration error:', err);
      alert(err?.data?.message || err?.data?.error || 'Failed to create company account. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-xl">
      <div className="bg-gradient-to-br from-blue-50 via-orange-50 p-6 sm:p-8 rounded-lg shadow-sm">
        {companyStep === 'company' && (
          <>
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Create Company Account
              </h2>
              <p className="text-gray-600">
                Enter your company details to get started
              </p>
            </div>

            <form onSubmit={handleCompanyDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  name="companyName"
                  type="text"
                  placeholder="Your company name"
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
                  Company Phone
                </label>
                <input
                  name="contactPhone"
                  type="tel"
                  placeholder="+92 3xx xxxxxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Address
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="123 Business St, Suite 100, City, Country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-between text-sm font-medium text-gray-700 mb-0">
                <label className="">Plan</label>
                <button
                  type="button"
                  onClick={() => router.push('/#pricing')}
                  className="mb-1 hover:text-primary"
                >
                  See All Plans
                </button>
              </div>
              <select
                name="planId"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
                disabled={isPlansLoading || !!plansError}
              >
                <option value="" disabled>
                  {isPlansLoading ? 'Loading plans…' : 'Select a plan'}
                </option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ${p.price} / {p.validateDays}d
                  </option>
                ))}
              </select>

              {plansError && (
                <p className="text-red-500 text-sm mt-1">
                  Failed to load plans.
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg mt-4 disabled:opacity-60"
                disabled={isCompanyLoading}
              >
                Next
              </button>
            </form>
          </>
        )}

        {companyStep === 'admin' && (
          <>
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Create Admin Account
              </h2>
              <p className="text-gray-600">
                Enter admin details for your company
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Name
                </label>
                <input
                  name="adminName"
                  type="text"
                  placeholder="Admin full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Phone
                </label>
                <input
                  name="adminPhone"
                  type="tel"
                  placeholder="+92 3xx xxxxxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin email
                </label>
                <input
                  name="adminEmail"
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Address
                </label>
                <input
                  name="adminAddress"
                  type="text"
                  placeholder="123 Home St, Suite 100, City, Country"
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
                disabled={isCompanyLoading}
              >
                {isCompanyLoading ? 'Creating Account…' : 'Create Company Account'}
              </button>

              {isCompanyError && (
                <p className="text-red-500 mt-4">
                  {companyError?.data?.message || companyError?.data?.error || 'Registration failed'}
                </p>
              )}

              <button
                type="button"
                onClick={() => setCompanyStep('company')}
                className="w-full text-gray-600 hover:underline font-medium mt-2"
              >
                Go back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}