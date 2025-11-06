// app/sign-up/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetAllPlansQuery } from '@/features/planApi';
import { useCreateCompanyMutation } from '@/features/CompanyApi';
import { Zap, Building2, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLoginMutation } from '@/features/authApi';
import RegisterLayout from './RegisterLayout';
import StepIndicator from './StepIndicator';
import PlanStep from './PlanStep';
import IndustryStep from './IndustryStep';
import DetailsStep from './DetailsStep';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [login] = useLoginMutation();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: plans = [], isLoading: isPlansLoading } = useGetAllPlansQuery();
  const [createCompany] = useCreateCompanyMutation();

  // Parse googleUser from URL
  useEffect(() => {
    const gu = searchParams.get("googleUser");
    if (gu) {
      try {
        const parsed = JSON.parse(decodeURIComponent(gu));
        setGoogleUser(parsed);
        console.log("Google user loaded:", parsed);

        // Pre-fill form
        setFormData(prev => ({
          ...prev,
          adminName: parsed.name || "",
          adminEmail: parsed.email,
          companyEmail: parsed.email,
        }));
      } catch (e) {
        console.error("Failed to parse googleUser:", e);
      }
    }
  }, [searchParams]);

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('step', step.toString());
    if (selectedPlan) params.set('plan', selectedPlan);
    if (selectedIndustry) params.set('industry', selectedIndustry);
    if (googleUser) {
      params.set('googleUser', encodeURIComponent(JSON.stringify(googleUser)));
    }
    router.replace(`/sign-up?${params.toString()}`, { shallow: true });
  }, [step, selectedPlan, selectedIndustry, googleUser, router]);

  // Normalize plans
  const normalizedPlans = plans.map(plan => ({
    _id: plan._id,
    name: plan.name,
    price: plan.price,
    interval: plan.validateDays ? `${plan.validateDays} days` : 'month',
    description: plan.description,
    popular: plan.popular ?? false,
    limitations: {
      maxStaff: plan.limitations?.maxStaff ?? 0,
      maxVendors: plan.limitations?.maxVendors ?? 0,
      maxInventoryItems: plan.limitations?.maxProductItems ?? 0,
      features: plan.limitations?.features ?? [],
    },
  }));

  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    adminName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
    industry: ""
  });

  const steps = [
    { num: 1, label: "Plan", icon: Zap },
    { num: 2, label: "Industry", icon: Building2 },
    { num: 3, label: "Details", icon: Sparkles }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!selectedPlan || !selectedIndustry) {
      setError("Please complete all steps.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        company: {
          name: formData.companyName,
          contactEmail: formData.companyEmail,
          plan: selectedPlan,
          industryName: selectedIndustry,
        },
        admin: {
          name: formData.adminName,
          email: formData.adminEmail,
          password: formData.password || undefined, // send even if Google user
        },
        googleUser: googleUser ? { googleId: googleUser.sub } : undefined, // KEY FIX
      };


      await createCompany(payload).unwrap();
      console.log("tehj payload i return: ", payload)
      await login({ email:payload.admin.email, password: payload.admin.password }).unwrap();
// router.push("/admin/dashboard");
      } catch (err) {
      console.error("Create company error:", err);
      setError(err?.data?.error || err?.data?.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPlansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <RegisterLayout>
      <StepIndicator steps={steps} currentStep={step} onStepClick={setStep} />

      <motion.div className="p-12 backdrop-blur-2xl bg-white/80 border border-white/50 shadow-2xl shadow-black/10 rounded-3xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <PlanStep
              plans={normalizedPlans}
              selectedPlan={selectedPlan}
              onPlanSelect={(planId) => {
                setSelectedPlan(planId);
                setStep(2);
              }}
              isLoading={isLoading}
            />
          )}

          {step === 2 && (
            <IndustryStep
              selectedIndustry={selectedIndustry}
              onIndustrySelect={(id, name) => {
                setSelectedIndustry(id);
                setFormData(prev => ({ ...prev, industry: name }));
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <DetailsStep
              formData={formData}
              setFormData={setFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              error={error}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              readOnlyGoogle={!!googleUser}
            />
          )}
        </AnimatePresence>

        {step > 1 && (
          <motion.div className="flex justify-between mt-8 pt-8 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(step - 1)}
              className="px-8 py-4 text-gray-600 hover:text-gray-800 font-semibold transition-colors flex items-center gap-2"
            >
              Previous
            </motion.button>

            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold cursor-pointer"
                >
                  Sign in
                </motion.span>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </RegisterLayout>
  );
}