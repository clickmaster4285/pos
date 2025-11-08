'use client';

import { useState, useEffect, useContext } from 'react';
import { useGetAllPlansQuery } from '@/features/planApi';
import PlanSelection from './PlanSelection';
import PaymentForm from './PaymentForm';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentGateway({ initialPlanId = '' }) {
  const [isSelectingPlan, setIsSelectingPlan] = useState(false);
  const [isPlanChanged, setIsPlanChanged] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const [isPlanSwitching, setIsPlanSwitching] = useState(false);

  const {
    data: plans = [],
    isLoading: isPlansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useGetAllPlansQuery();

  const { user } = useContext(AuthContext);

  // If initialPlanId is provided → treat it as pending plan
  const lastSelectedPlan = initialPlanId
    ? { _id: initialPlanId, planId: initialPlanId, status: 'not started' }
    : null;

  const [selectedPlan, setSelectedPlan] = useState(lastSelectedPlan?._id || '');
  const [selectedPlanId, setSelectedPlanId] = useState(lastSelectedPlan?.planId || '');

  const selectedPlanData = plans?.find((p) => p._id === selectedPlan);

  // Auto-select if initialPlanId is passed
  useEffect(() => {
    if (initialPlanId && !hasUserSelected) {
      setSelectedPlan(initialPlanId);
      setSelectedPlanId(initialPlanId);
      setHasUserSelected(true);
    }
  }, [initialPlanId, hasUserSelected]);

  // Refresh after payment
  useEffect(() => {
    if (paymentCompleted) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [paymentCompleted]);

  const handlePlanSelect = async (planId) => {
    if (isPlanSwitching) return;
    setIsPlanSwitching(true);

    setHasUserSelected(true);
    setSelectedPlan(planId);
    setSelectedPlanId(planId);
    setIsPlanChanged(true);
    setIsSelectingPlan(false);

    setIsPlanSwitching(false);
  };

  const handleBackToPlans = () => {
    setSelectedPlan('');
    setSelectedPlanId('');
    setIsSelectingPlan(true);
    setIsPlanChanged(false);
  };

  const handlePaymentComplete = () => {
    setPaymentCompleted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Manage Your Subscription Plan
          </h1>

          {selectedPlanData?.name ? (
            <p className="text-lg text-gray-600 mt-3">
              Selected Plan:{' '}
              <span className="font-semibold">{selectedPlanData.name}</span>
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {initialPlanId ? 'Ready for Payment' : 'Pending change'}
              </span>
            </p>
          ) : null}
        </div>

        {paymentCompleted && (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">
              Payment completed successfully! Refreshing page...
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Show Plan Selection only if no initialPlanId and not already selected */}
          {(!initialPlanId || (isSelectingPlan && !hasUserSelected)) && (
            <div className="space-y-6">
              <PlanSelection
                plans={plans}
                selectedPlan={selectedPlan}
                onPlanSelect={handlePlanSelect}
                isLoading={isPlansLoading}
                isChangingPlan={isPlanSwitching}
              />
            </div>
          )}

          <div className="space-y-6">
            {/* Show "Change Plan" only if initialPlanId was given */}
            {initialPlanId && !isSelectingPlan && (
              <Button
                onClick={handleBackToPlans}
                className="w-full sm:w-auto bg-gray-700 text-white hover:bg-gray-800 transition-colors"
                disabled={isPlansLoading || isPlanSwitching}
              >
                Select Another Plan
              </Button>
            )}

            <div className="w-full">
              <PaymentForm
                priceId={selectedPlan}
                plan={selectedPlanData}
                isLoading={isPlansLoading || isPlanSwitching}
                showPlanSelection={!initialPlanId || isSelectingPlan}
                currentPlanId={selectedPlanId}
                isPlanChanged={isPlanChanged}
                onPaymentComplete={handlePaymentComplete}
              />
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Need help choosing a plan?{' '}
            <a href="/contact" className="text-blue-600 hover:underline font-medium">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}