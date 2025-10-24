'use client';

import { useState, useEffect, useContext } from 'react';
import { useGetAllPlansQuery, useChangePlanMutation } from '@/features/planApi';
import PlanSelection from './PlanSelection';
import PaymentForm from './PaymentForm';
import { useGetCompanyQuery } from '@/features/CompanyApi';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentGateway({ initialPlanId = '' }) {
  const [isSelectingPlan, setIsSelectingPlan] = useState(false);
  const [isPlanChanged, setIsPlanChanged] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // prevent auto-select from overriding a manual pick
  const [hasUserSelected, setHasUserSelected] = useState(false);
  // debounce/guard rapid clicks
  const [isPlanSwitching, setIsPlanSwitching] = useState(false);

  const {
    data: plans = [],
    isLoading: isPlansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useGetAllPlansQuery();

  const {
    data: mycompany,
    isLoading: companyLoading,
    refetch: refetchCompany,
  } = useGetCompanyQuery();

  const { user } = useContext(AuthContext);
  const [changePlan, { isLoading: isChangingPlan }] = useChangePlanMutation();

  // Last pending company-plan (status: not started)
  const lastSelectedPlan = mycompany?.data?.plan?.find(
    (plan) => plan.status === 'not started'
  );

  // Catalog plan id user is about to pay for
  const [selectedPlan, setSelectedPlan] = useState(lastSelectedPlan?._id || '');
  // Company plan "token id" (string) used by backend (sent as currentPlanId to PaymentForm)
  const [selectedPlanId, setSelectedPlanId] = useState(
    lastSelectedPlan?.planId || ''
  );

  const selectedPlanData = plans?.find((p) => p._id === selectedPlan);
  const companyData = mycompany?.data;
  const isCurrentPlanActive = companyData?.plan?.[0]?.isActive;

  // Helpers for header only
  const activeCompanyPlan = companyData?.plan?.find((p) => p.isActive) || null;
  const latestCompanyPlan = companyData?.plan?.length
    ? [...companyData.plan].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0]
    : null;
  const currentCompanyPlanToShow =
    activeCompanyPlan || latestCompanyPlan || null;

  // Respect the plan chosen in parent (only once)
  useEffect(() => {
    if (initialPlanId && !hasUserSelected) {
      setSelectedPlan(initialPlanId);

      // try to find a pending company plan for this catalog id
      const pendingCP = mycompany?.data?.plan?.find(
        (p) => p.planId === initialPlanId && p.status === 'not started'
      );
      const parentCurrentPlanId = pendingCP?.planId || initialPlanId;
      setSelectedPlanId(parentCurrentPlanId);

      setHasUserSelected(true);
    }
  }, [initialPlanId, hasUserSelected, mycompany?.data?.plan]);

  // Refresh page after successful payment
  useEffect(() => {
    if (paymentCompleted) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [paymentCompleted]);

  const handlePlanSelect = async (planId) => {
    if (isPlanSwitching) return; // guard rapid clicks
    setIsPlanSwitching(true);

    setHasUserSelected(true);
    setSelectedPlan(planId);

    // set a safe fallback immediately so PaymentForm has something
    const prePending = mycompany?.data?.plan?.find(
      (p) => p.planId === planId && p.status === 'not started'
    );
    const preCurrentPlanId = prePending?.planId || planId;
    setSelectedPlanId(preCurrentPlanId);

    const newPlan = plans.find((p) => p._id === planId);

    if (
      newPlan &&
      lastSelectedPlan &&
      planId !== lastSelectedPlan._id &&
      !isCurrentPlanActive
    ) {
      try {
        const response = await changePlan({
          changingPlanId: lastSelectedPlan._id,
          newPlanId: planId,
        }).unwrap();

        const newCompanyPlan =
          response.updatedPlans.find(
            (p) => p.planId === response.newPlanId && p.status === 'not started'
          ) ||
          response.updatedPlans.find(
            (p) => p.planId === planId && p.status === 'not started'
          );

        const finalCurrentPlanId =
          newCompanyPlan?.planId || response?.newPlanId || planId;

        setSelectedPlanId(finalCurrentPlanId);

        setIsPlanChanged(true);

        await refetchPlans();
        await refetchCompany();
      } catch (error) {
        console.error('Failed to change plan:', error);
      } finally {
        setIsPlanSwitching(false);
      }
    } else {
      setIsPlanSwitching(false);
    }

    setIsSelectingPlan(false);
  };

  const handleBackToPlans = () => {
    if (!isCurrentPlanActive) {
      setSelectedPlan('');
      setSelectedPlanId('');
      setIsSelectingPlan(true);
      setIsPlanChanged(false);
      // keep hasUserSelected = true so auto-select doesn’t override
    }
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
          {(hasUserSelected || isSelectingPlan) && selectedPlanData?.name ? (
            <p className="text-lg text-gray-600 mt-3">
              Selected Plan:{' '}
              <span className="font-semibold">{selectedPlanData.name}</span>
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Pending change
              </span>
            </p>
          ) : currentCompanyPlanToShow ? (
            <p className="text-lg text-gray-600 mt-3">
              Current Plan:{' '}
              <span className="font-semibold">
                {currentCompanyPlanToShow.name}
              </span>
              {currentCompanyPlanToShow.isActive && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              )}
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
          {isSelectingPlan && !isCurrentPlanActive && (
            <div className="space-y-6">
              <PlanSelection
                plans={plans}
                selectedPlan={selectedPlan}
                onPlanSelect={handlePlanSelect}
                isLoading={isPlansLoading}
                isChangingPlan={isChangingPlan || isPlanSwitching}
              />
            </div>
          )}

          <div className="space-y-6">
            {!isCurrentPlanActive && !isSelectingPlan && (
              <Button
                onClick={handleBackToPlans}
                className="w-full sm:w-auto bg-gray-700 text-white hover:bg-gray-800 transition-colors"
                disabled={
                  isPlansLoading ||
                  companyLoading ||
                  isCurrentPlanActive ||
                  isChangingPlan ||
                  isPlanSwitching
                }
              >
                Select Another Plan
              </Button>
            )}

            {/* Keep PaymentForm on its own row/stack */}
            <div className="w-full">
              <PaymentForm
                priceId={selectedPlan}
                plan={selectedPlanData}
                isLoading={isPlansLoading || isChangingPlan || isPlanSwitching}
                showPlanSelection={isSelectingPlan}
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
            <a
              href="/contact"
              className="text-blue-600 hover:underline font-medium"
            >
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
