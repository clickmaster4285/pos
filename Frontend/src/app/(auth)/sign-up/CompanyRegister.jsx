'use client';

import { useState } from 'react';
import { useCreateCompanyMutation } from '@/features/CompanyApi';
import { useGetAllPlansQuery } from '@/features/planApi';
import { useRouter } from 'next/navigation';
import PlanSelection from '@/components/PaymentGateWay/PlanSelection';
import {Industries} from '@/utils/industryFields'; 

export default function CompanyRegister({ setStep, setEmailForVerify }) {
  const [companyStep, setCompanyStep] = useState('plan'); // 'plan' | 'company' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [planId, setPlanId] = useState('');
  const [companyData, setCompanyData] = useState({}); // Store company form data

  const [createCompany, { isLoading: isCompanyLoading, isError: isCompanyError, error: companyError }] = useCreateCompanyMutation();
  const { data: plans = [], isLoading: isPlansLoading, error: plansError } = useGetAllPlansQuery();
  const router = useRouter();

  // Handle Plan Selection
  const handlePlanSelect = (selectedPlanId) => {
    setPlanId(selectedPlanId);
    setCompanyStep('company');
  };

  // Handle Company Details Submission
  const handleCompanyDetailsSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setCompanyData({
      name: data.companyName,
      industryName: data.industryName, // Store selected industry
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
    <div className="w-full px-4">
      <div className="bg-gradient-to-br from-blue-50 via-orange-50 p-6 sm:p-8 rounded-lg shadow-sm">
        {companyStep === 'plan' && (
          <div className="max-w-6xl mx-3">
            <PlanSelection
              plans={plans}
              selectedPlan={planId}
              onPlanSelect={handlePlanSelect}
              isLoading={isPlansLoading}
            />
            {plansError && (
              <p className="text-red-500 text-sm mt-4">
                Failed to load plans. Please try again.
              </p>
            )}
          </div>
        )}

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
                  Industry
                </label>
                <select
                  name="industryName"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="" disabled selected>
                    Select an industry
                  </option>
                  {Industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
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

              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg mt-4 disabled:opacity-60"
                disabled={isCompanyLoading}
              >
                Next
              </button>

              <button
                type="button"
                onClick={() => setCompanyStep('plan')}
                className="w-full text-gray-600 hover:underline font-medium mt-2"
              >
                Go back to Plan Selection
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
                  Admin Email
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