'use client';

import { useState, useEffect, useContext } from 'react';
import { useGetAllPlansQuery, useChangePlanMutation } from '@/features/planApi';
import PlanSelection from './PlanSelection';
import PaymentForm from './PaymentForm';
import { useGetCompanyQuery } from '@/features/CompanyApi';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentGateway() {
  const [isSelectingPlan, setIsSelectingPlan] = useState(false);
  const [isPlanChanged, setIsPlanChanged] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  const { data: plans = [], isLoading: isPlansLoading, error: plansError, refetch: refetchPlans } = useGetAllPlansQuery();
  const { data: mycompany, isLoading: companyLoading, refetch: refetchCompany } = useGetCompanyQuery();
  
  const { user } = useContext(AuthContext);
  const [changePlan, { isLoading: isChangingPlan }] = useChangePlanMutation();

  // Get the latest plan, sorted by updatedAt
  const lastSelectedPlan = mycompany?.data?.plan
    ?.find((plan) => plan.status === "not started");
  const [selectedPlan, setSelectedPlan] = useState(lastSelectedPlan?._id || '');
  const [selectedPlanId, setSelectedPlanId] = useState(lastSelectedPlan?.planId || '');

  const selectedPlanData = plans?.find((p) => p._id === selectedPlan);
  const companyData = mycompany?.data;
  const isCurrentPlanActive = companyData?.plan?.[0]?.isActive;

  // Log errors for debugging
  useEffect(() => {
    if (plansError) {
      console.log({
        title: 'Error',
        description: 'Failed to load plans',
        variant: 'destructive',
      });
    }
  }, [plansError]);

  // Auto-select the company's current plan if active
  useEffect(() => {
    if (
      !companyLoading &&
      companyData?.plan?.[0]?.isActive &&
      !selectedPlan &&
      !isSelectingPlan
    ) {
      setSelectedPlan(companyData.plan[0]._id);
      setSelectedPlanId(companyData.plan[0].planId);
      setIsSelectingPlan(false);
    }
  }, [companyData, companyLoading, selectedPlan, isSelectingPlan]);

  // Refresh data when payment is completed
  useEffect(() => {
    if (paymentCompleted) {
      // Refresh the page after 2 seconds to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [paymentCompleted]);

  const handlePlanSelect = async (planId) => {
    const newPlan = plans.find((p) => p._id === planId);
    
    if (newPlan && lastSelectedPlan && planId !== lastSelectedPlan._id && !isCurrentPlanActive) {
      try {
        const response = await changePlan({
          changingPlanId: lastSelectedPlan._id,
          newPlanId: planId,
        }).unwrap();
        
        const newCompanyPlan = response.updatedPlans.find((p) => p._id === planId);
        setSelectedPlanId(newCompanyPlan.planId);
        setIsPlanChanged(true);
        console.log('Plan changed successfully:', response);
        
        // Refresh plans and company data
        await refetchPlans();
        await refetchCompany();
        
      } catch (error) {
        console.error('Failed to change plan:', error);
      }
    } else {
      setSelectedPlan(planId);
    }
    
    setIsSelectingPlan(false);
  };

  const handleBackToPlans = () => {
    if (!isCurrentPlanActive) {
      setSelectedPlan('');
      setSelectedPlanId('');
      setIsSelectingPlan(true);
      setIsPlanChanged(false);
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
          {companyData?.plan?.[0]?.name && (
            <p className="text-lg text-gray-600 mt-3">
              Current Plan: <span className="font-semibold">{companyData.plan[0].name}</span>
              {isCurrentPlanActive && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              )}
            </p>
          )}
        </div>
        
        {paymentCompleted && (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">
              Payment completed successfully! Refreshing page...
            </AlertDescription>
          </Alert>
        )}

        {isCurrentPlanActive && !paymentCompleted && (
          <Alert className="mb-8">
            <AlertDescription>
              Your current plan is active. To change plans, please wait until the current plan expires or contact support.
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
                isChangingPlan={isChangingPlan}
              />
            </div>
          )}
          <div className="space-y-6">
            {!isCurrentPlanActive && !isSelectingPlan && (
              <Button
                onClick={handleBackToPlans}
                className="w-full sm:w-auto bg-gray-700 text-white hover:bg-gray-800 transition-colors"
                disabled={isPlansLoading || companyLoading || isCurrentPlanActive || isChangingPlan}
              >
                Select Another Plan
              </Button>
            )}
            <PaymentForm
              priceId={selectedPlan}
              plan={selectedPlanData}
              isLoading={isPlansLoading || isChangingPlan}
              isSelectingPlan={isSelectingPlan}
              currentPlanId={selectedPlanId}
              isPlanChanged={isPlanChanged}
              onPaymentComplete={handlePaymentComplete}
            />
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