'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useCreatePaymentIntentMutation,
  useGetStripPublishKeyQuery,
  useConfirmAndUpgradePlanMutation,
} from '@/features/paymentGatewayApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Shield, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useGetCompanyQuery } from '@/features/CompanyApi';

function CheckoutForm({
  priceId,
  plan,
  isLoading: isPlanLoading,
  showPlanSelection,
  currentPlanId,
  isPlanChanged,
  onPaymentComplete,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const [confirmAndUpgradePlan] = useConfirmAndUpgradePlanMutation();
  const { data: companyData } = useGetCompanyQuery();

  // Reset form when plan changes
  useEffect(() => {
    setError('');
    setPaymentSuccess(false);
  }, [priceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPaymentSuccess(false);

    if (!stripe || !elements || !priceId) {
      setError('Please select a plan and ensure payment is ready');
      return;
    }

    if (!currentPlanId) {
      setError('No pending company plan entry. Please reselect a plan.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      // 1) Create PaymentIntent
      const response = await createPaymentIntent({
        priceId,
        currency: 'PKR',
        planId: currentPlanId,
      }).unwrap();

      const { clientSecret } = response;

      // 2) Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: 'Customer Name' },
          
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed.');
      } else if (result.paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        // 3) Upgrade plan on the server
        try {
          const upgradePayload = {
            companyId: companyData?.data?.companyId,
            pricePlanMongoId: priceId,
            planId: currentPlanId,
            paymentIntentId: result.paymentIntent.id,
            companyPlanId: response.companyPlanId
          };

          await confirmAndUpgradePlan(upgradePayload).unwrap();
        } catch (err) {
          console.error('Failed to upgrade plan:', err);
          setError(err?.data?.error || 'Plan upgrade failed.');
        }

        // 4) Notify parent
        if (onPaymentComplete) onPaymentComplete();
      }
    } catch (err) {
      setError(err?.data?.error || 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Show message if no plan selected and not in selection mode
  if (!priceId && !showPlanSelection) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please select a plan to proceed with payment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
          <CreditCard className="w-6 h-6 text-primary/60" />
          Payment Details
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {paymentSuccess && !error && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Payment and Plan Upgrade completed successfully! The page will refresh shortly.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {plan && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 text-lg">
              Order Summary
            </h4>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">{plan.name} Plan</span>
              <span className="font-semibold text-gray-900">
                Rs {plan.price}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
              <span>Billing Cycle</span>
              <span>{plan.interval || 'Monthly'}</span>
            </div>
            {plan.validateDays && (
              <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                <span>Validity</span>
                <span>{plan.validateDays} days</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && !paymentSuccess && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!paymentSuccess && (
            <>
              <div className="space-y-4">
                <Label
                  htmlFor="card-element"
                  className="text-sm font-medium text-gray-700"
                >
                  Card Information
                </Label>
                <div className="border rounded-lg p-3 bg-white shadow-sm border-gray-200">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif',
                          '::placeholder': { color: '#9CA3AF' },
                        },
                        invalid: { color: '#EF4444' },
                      },
                      hidePostalCode: true,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    I agree to the{' '}
                    <a href="/terms" className="text-primary/60 hover:underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary/60 hover:underline">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
              </div>

              <div className="rounded-lg p-4 space-y-3 border border-primary/10">
                <div className="flex items-center gap-2 text-primary/80">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-primary/70">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">
                    Your payment information is encrypted and secure
                  </span>
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={
              !stripe ||
              isLoading ||
              !priceId ||
              !acceptedTerms ||
              paymentSuccess
            }
            className="w-full bg-primary/60 hover:bg-primary/70 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Payment...
              </div>
            ) : paymentSuccess ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Payment Successful
              </div>
            ) : (
              `Pay Rs ${plan?.price || ''} Now`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PaymentForm({
  priceId,
  plan,
  isLoading,
  showPlanSelection,
  currentPlanId,
  isPlanChanged,
  onPaymentComplete,
}) {
  const { data: publishKey } = useGetStripPublishKeyQuery();

  const stripePromise = useMemo(() => {
    if (!publishKey?.data) return null;
    return loadStripe(publishKey.data);
  }, [publishKey?.data]);

  if (!stripePromise) {
    return (
      <Alert>
        <AlertDescription>Loading payment gateway…</AlertDescription>
      </Alert>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        priceId={priceId}
        plan={plan}
        isLoading={isLoading}
        showPlanSelection={showPlanSelection}
        currentPlanId={currentPlanId}
        isPlanChanged={isPlanChanged}
        onPaymentComplete={onPaymentComplete}
      />
    </Elements>
  );
}