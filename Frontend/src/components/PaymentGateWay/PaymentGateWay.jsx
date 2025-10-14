'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useCreatePaymentIntentMutation } from '@/features/paymentGatewayApi';
import { useGetAllPlansQuery } from '@/features/planApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ priceId, planName }) {
  const stripe = useStripe();
  const elements = useElements();
  const [createPaymentIntent, { isLoading }] = useCreatePaymentIntentMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !priceId) {
      console.log(`({
        title: 'Error',
        description: 'Please select a plan and ensure payment is ready',
        variant: 'destructive',
      })`);
      return;
    }

    try {
      const response = await createPaymentIntent({ priceId, currency:"PKR" }).unwrap();
      const { clientSecret } = response;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        console.log(`({
          title: 'Payment Error',
          description: result.error.message,
          variant: 'destructive',
        })`);
      } else if (result.paymentIntent.status === 'succeeded') {
        console.log(`({
          title: 'Success',
          description: 'Payment completed successfully!',
        })`);
      }
    } catch (error) {
      console.log(`({
        title: 'Payment Error',
        description: error.data?.error || 'Failed to process payment',
        variant: 'destructive',
      })`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Card Details</label>
        <div className="border rounded-md p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': { color: '#aab7c4' },
                },
                invalid: { color: '#9e2146' },
              },
            }}
          />
        </div>
      </div>
      <Button type="submit" disabled={!stripe || isLoading || !priceId} className="w-full">
        {isLoading ? 'Processing...' : `Pay for ${planName || 'Plan'}`}
      </Button>
    </form>
  );
}

export default function PaymentGateWay() {
  const [selectedPlan, setSelectedPlan] = useState('');
  const { data: plans = [], isLoading: isPlansLoading, error: plansError } = useGetAllPlansQuery();

  useEffect(() => {
    if (plansError) {
      console.log(`
        title: 'Error',
        description: 'Failed to load plans',
        variant: 'destructive',
      `);
    }
  }, [plansError]);

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Subscribe to a Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Select Plan</label>
              <Select onValueChange={setSelectedPlan} value={selectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder={isPlansLoading ? 'Loading plans...' : 'Choose a plan'} />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.amount} {plan.currency} / {plan.interval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                priceId={selectedPlan}
                planName={plans?.find((p) => p.id === selectedPlan)?.name}
              />
            </Elements>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}