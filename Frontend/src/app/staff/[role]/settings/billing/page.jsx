'use client';

import React, { useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'sonner';
import { Users, Share2, CreditCard, Lock } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import {
  useGetUserQuery,
  useBillingPlansManagementMutation,
} from '@/features/authApi';

import { createCheckoutSession } from '@/features/billingApi';

const ChangePlanDialog = dynamic(
  () => import('@/components/settings/ChangePlanDialog'),
  { ssr: false }
);

export default function Page() {
  const orgRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { data: user, isLoading, isError, refetch } = useGetUserQuery();
  const [updateBilling, { isLoading: saving }] =
    useBillingPlansManagementMutation();

  const plan = (user?.subscription?.plan || 'free').toLowerCase(); // 'free' | 'essentials' | 'team'
  const cancelAtPeriodEnd = !!user?.subscription?.cancelAtPeriodEnd;

  const channelsUsed = user?.socialAccounts ?? 0; // number
  const channelLimit = plan === 'free' ? 3 : undefined;
  const channelsText = channelLimit
    ? `${channelsUsed}/${channelLimit}`
    : `${channelsUsed}`;

  const planLabel =
    plan === 'team' ? 'TEAM' : plan === 'essentials' ? 'ESSENTIALS' : 'FREE';

  const planBadgeClass =
    plan === 'free' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800';

  const handleOpen = () => setOpen(true);
  const handleConfirmPlan = async ({
    plan: nextPlan, // 'free' | 'essentials' | 'team'
    billing, // 'monthly' | 'yearly'
    channels,
    useStripeCheckout, // boolean (if you have a "pay now" button)
    stripeCustomerId, // only pass when you truly have them
    stripeSubscriptionId,
  }) => {
    try {
      const isPaid = nextPlan === 'essentials' || nextPlan === 'team';

      // If paying now → go to Stripe; webhooks will update IDs/dates
      if (useStripeCheckout) {
        const session = await createCheckoutSession({
          plan: nextPlan,
          billing,
          channels,
        });
        if (session?.url) {
          window.location.href = session.url;
          return;
        }
        toast.error('Could not start checkout.');
        return;
      }

      // Helpers
      const addDays = (date, days) => {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() + days);
        return d;
      };
      const addMonths = (date, n) => {
        const d = new Date(date);
        d.setUTCMonth(d.getUTCMonth() + n);
        return d;
      };
      const toISO = (d) => new Date(d).toISOString();

      const now = new Date();
      const payload = {
        subscription: {
          plan: nextPlan,
          cancelAtPeriodEnd: false,
        },
      };

      if (isPaid) {
        // dates
        const cps = now;
        const cpe =
          billing === 'monthly' ? addMonths(now, 1) : addMonths(now, 12);
        const te = addDays(now, 7);

        payload.subscription.currentPeriodStart = toISO(cps);
        payload.subscription.currentPeriodEnd = toISO(cpe);
        payload.subscription.trialEnd = toISO(te);

        // only attach IDs if you actually have them already
        if (stripeCustomerId)
          payload.subscription.stripeCustomerId = stripeCustomerId;
        if (stripeSubscriptionId)
          payload.subscription.stripeSubscriptionId = stripeSubscriptionId;
      } else {
        // FREE → clear everything
        payload.subscription.currentPeriodStart = null;
        payload.subscription.currentPeriodEnd = null;
        payload.subscription.trialEnd = null;
        payload.subscription.stripeCustomerId = null;
        payload.subscription.stripeSubscriptionId = null;
      }

      await updateBilling(payload).unwrap();
      setOpen(false);
      await refetch();

      toast.success('Plan updated', {
        description: `Switched to ${
          nextPlan === 'team'
            ? 'Team'
            : nextPlan === 'essentials'
            ? 'Essentials'
            : 'Free'
        } (${billing}).`,
      });
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to update plan');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mt-2 mx-auto p-4">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="max-w-4xl mt-2 mx-auto p-4">
        <div className="text-sm text-red-600">Could not load user.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mt-2 mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Billing</h1>
      </header>

      <Card>
        <CardContent>
          <div className="mb-4 border-b pb-4 justify-between flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Plan:</h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${planBadgeClass}`}
                >
                  {planLabel}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-600">
                {plan === 'free'
                  ? 'The Free plan is limited to 3 channels. Upgrade to unlock more.'
                  : plan === 'essentials'
                  ? 'Essentials: per-channel pricing. Add more channels any time.'
                  : 'Team: everything in Essentials plus collaboration features.'}
              </p>

              {cancelAtPeriodEnd && (
                <p className="mt-1 text-xs text-amber-700">
                  Your plan will cancel at the end of the current period.
                </p>
              )}
            </div>

            <div>
              <Button className="row-span-2 self-center" onClick={handleOpen}>
                Change Plan
              </Button>
            </div>
          </div>

          <div className="pt-5 flex flex-col sm:flex-row items-start border rounded-md overflow-hidden divide-y sm:divide-y-0 sm:divide-x">
            {/* Users */}
            <div className="flex-1 p-4 flex flex-col items-center text-center gap-1">
              <span className="p-2 rounded-full text-primary bg-primary-100">
                <Users className="h-6 w-6" />
              </span>
              <h2 className="text-sm font-semibold">Users</h2>
              <p className="text-xs text-muted-foreground">
                {plan === 'team' ? 'Unlimited' : 'Limited to 1'}
              </p>
              <div className="text-lg font-bold">
                {plan === 'team' ? 'Unlimited' : '1'}
              </div>
            </div>

            {/* Channels */}
            <div className="flex-1 p-4 flex flex-col items-center text-center gap-1">
              <span className="p-2 rounded-full text-primary bg-primary-100">
                <Share2 className="h-6 w-6" />
              </span>
              <h2 className="text-sm font-semibold">Channels</h2>
              <p className="text-xs text-muted-foreground">
                {plan === 'free' ? '$0 each per month' : 'Per-channel pricing'}
              </p>
              <div className="text-lg font-bold">{channelsText}</div>

              {plan === 'free' && channelsUsed < 3 && (
                <div className="mt-1 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">
                    {3 - channelsUsed} channel
                    {3 - channelsUsed === 1 ? '' : 's'} locked
                  </span>
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={handleOpen}
                  >
                    Unlock
                  </button>
                </div>
              )}
            </div>

            {/* Upcoming bill */}
            <div className="flex-1 p-4 flex flex-col items-center text-center gap-1">
              <span className="p-2 rounded-full text-primary bg-primary-100">
                <CreditCard className="h-6 w-6" />
              </span>
              <h2 className="text-sm font-semibold">Upcoming bill</h2>
              <p className="text-xs text-muted-foreground">Usage changes</p>
              <div className="text-lg font-bold">
                {plan === 'free'
                  ? '$0.00'
                  : plan === 'essentials'
                  ? '$60'
                  : '$120'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
          {open ? (
            <ChangePlanDialog
              initialPlan={plan === 'free' ? 'essentials' : plan}
              initialChannels={Math.max(1, channelsUsed || 1)}
              defaultBilling="yearly"
              onConfirm={handleConfirmPlan}
              saving={saving}
              onClose={() => setOpen(false)}
            />
          ) : null}
        </Suspense>
      </Dialog>

      <Toaster richColors position="top-right" />
    </div>
  );
}
