// PaymentGateway.jsx
'use client';

import { useState, useEffect, useContext } from 'react';
import { useGetAllPlansQuery } from '@/features/planApi';   // <-- add import
import PlanSelection from './PlanSelection';
import PaymentForm from './PaymentForm';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTryFreePlanMutation } from '@/features/CompanyApi';

export default function PaymentGateway({ initialPlanId = '' }) {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [currentPlanId, setCurrentPlanId] = useState('');
  const [isPlanSelected, setIsPlanSelected] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isPlanSwitching, setIsPlanSwitching] = useState(false);

  const {
    data: plans = [],
    isLoading: isPlansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useGetAllPlansQuery();

  const { user } = useContext(AuthContext);

  // NEW -------------------------------------------------
  const [tryFreePlan, { isLoading: freeLoading, isSuccess: freeSuccess, error: freeError }] =
    useTryFreePlanMutation();
  // -----------------------------------------------------

  // Auto-select plan if initialPlanId is passed
  useEffect(() => {
    if (initialPlanId && !isPlanSelected) {
      const plan = plans.find(p => p._id === initialPlanId);
      if (plan) {
        setSelectedPlan(initialPlanId);
        setCurrentPlanId(initialPlanId);
        setIsPlanSelected(true);
      }
    }
  }, [initialPlanId, plans, isPlanSelected]);

  // Refresh after payment OR free-plan success
  useEffect(() => {
    if (paymentCompleted || freeSuccess) {
      setTimeout(() => window.location.reload(), 1500);
    }
  }, [paymentCompleted, freeSuccess]);

  const handlePlanSelect = async (planId) => {
    if (isPlanSwitching) return;
    setIsPlanSwitching(true);

    const plan = plans.find(p => p._id === planId);
    if (plan?.price === 0) {
      // ---- FREE PLAN LOGIC ----
      try {
        await tryFreePlan(planId).unwrap();
        // success → page will reload via useEffect above
      } catch (e) {
        console.error('Free plan error', e);
        // you can show a toast / alert here if you want
      } finally {
        setIsPlanSwitching(false);
      }
      return;
    }

    // ---- PAID PLAN LOGIC ----
    setSelectedPlan(planId);
    setCurrentPlanId(planId);
    setIsPlanSelected(true);
    setIsPlanSwitching(false);
  };

  const handleBackToPlans = () => {
    setSelectedPlan('');
    setCurrentPlanId('');
    setIsPlanSelected(false);
  };

  const handlePaymentComplete = () => {
    setPaymentCompleted(true);
  };

  const selectedPlanData = plans.find(p => p._id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Full Plan Selection View */}
        {!isPlanSelected && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                Choose Your Subscription Plan
              </h1>
              <p className="text-lg text-gray-600 mt-3">
                Pick the perfect plan to grow your business
              </p>
            </div>

            <PlanSelection
              plans={plans}
              selectedPlan={selectedPlan}
              onPlanSelect={handlePlanSelect}
              isLoading={isPlansLoading}
              isChangingPlan={isPlanSwitching || freeLoading}
            />
          </>
        )}

        {/* Payment Form View (after plan selected) */}
        {isPlanSelected && selectedPlanData?.price !== 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Complete Your Payment
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Selected Plan:{' '}
                <span className="font-semibold">{selectedPlanData?.name}</span>
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {initialPlanId ? 'Ready for Payment' : 'Pending change'}
                </span>
              </p>
            </div>

            {paymentCompleted && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <AlertDescription className="text-green-700">
                  Payment completed successfully! Refreshing page...
                </AlertDescription>
              </Alert>
            )}

            {/* Back Button */}
            <div className="mb-6">
              <Button
                onClick={handleBackToPlans}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isPlansLoading || isPlanSwitching}
              >
                ← Select Another Plan
              </Button>
            </div>

            {/* Payment Form */}
            <PaymentForm
              priceId={selectedPlan}
              plan={selectedPlanData}
              isLoading={isPlansLoading || isPlanSwitching}
              showPlanSelection={false}
              currentPlanId={currentPlanId}
              isPlanChanged={!!initialPlanId}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>
        )}

        {/* FREE PLAN SUCCESS MESSAGE */}
        {freeSuccess && (
          <div className="max-w-2xl mx-auto text-center mt-12">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                Free plan activated! Refreshing page...
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Footer Help */}
        {!isPlanSelected && (
          <div className="mt-16 text-center text-gray-600">
            <p className="text-sm">
              Need help choosing a plan?{' '}
              <a href="/contact" className="text-blue-600 hover:underline font-medium">
                Contact our sales team
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}