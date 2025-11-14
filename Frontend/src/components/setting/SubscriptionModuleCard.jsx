'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Users, Package, Factory } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useGetAllPlansQuery } from '@/features/planApi';
import PlanSelection from '@/components/PaymentGateWay/PlanSelection';
import PaymentGateway from '@/components/PaymentGateWay/PaymentGateway';

const pickCurrentCompanyPlan = (arr = []) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const active = arr.find((p) => p.isActive);
  if (active) return active;
  return [...arr].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )[0];
};

const computeNextRenewal = (planItem) => {
  if (!planItem) return '—';
  const days = Number(planItem.validateDays) || 0;
  if (!days || !planItem.createdAt) return '—';
  const start = new Date(planItem.createdAt);
  const renewal = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return renewal.toLocaleDateString();
};

export default function SubscriptionModuleCard({
  companyPlan = [],
  title = 'Company Subscription',
}) {
  const router = useRouter();

  // summary info from server
  const showing = useMemo(
    () => pickCurrentCompanyPlan(companyPlan),
    [companyPlan]
  );
  const status = (
    showing?.status || (showing?.isActive ? 'active' : '—')
  )?.toString();
  const nextRenewal = computeNextRenewal(showing);
  const lim = showing?.limitations || {};

  // load plans for PlanSelection
  const {
    data: plansRaw,
    isLoading: isPlansLoading,
    error: plansError,
  } = useGetAllPlansQuery();
  const plans = Array.isArray(plansRaw?.data)
    ? plansRaw.data
    : Array.isArray(plansRaw)
    ? plansRaw
    : [];

  // UI flags
  const [showPicker, setShowPicker] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // when user clicks a plan card in PlanSelection
  const handlePlanSelect = (planId) => {
    setSelectedPlanId(String(planId));
    setShowPicker(false);
    setShowGateway(true);
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-muted p-2">
          <Crown className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-medium">{title}</h2>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Current Plan</div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase">
              {showing?.name || '—'}
            </Badge>
            {status && status !== '—' ? (
              <Badge>{status.toUpperCase()}</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Price</div>
          <div className="font-medium">
            {typeof showing?.price === 'number' ? `PKR ${showing.price}` : '—'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Valid For</div>
          <div className="font-medium">
            {showing?.validateDays ? `${showing.validateDays} day(s)` : '—'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Next Renewal</div>
          <div className="font-medium">{nextRenewal}</div>
        </div>
      </div>

      {/* Limitations */}
      <Separator className="my-4" />
      <div className="space-y-3">
        <div className="text-sm font-medium">Limitations</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> Max Staff
            </div>
            <div className="text-xl font-semibold mt-1">
              {typeof lim.maxStaff === 'number' ? lim.maxStaff : '—'}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" /> Max Inventory Items
            </div>
            <div className="text-xl font-semibold mt-1">
              {typeof lim.maxProductItems === 'number'
                ? lim.maxProductItems
                : '—'}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Factory className="h-4 w-4" /> Max Vendors
            </div>
            <div className="text-xl font-semibold mt-1">
              {typeof lim.maxVendors === 'number' ? lim.maxVendors : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <Separator className="my-4" />
      <div className="flex items-center gap-2">
        {!showGateway && (
          <Button onClick={() => setShowPicker((v) => !v)}>
            {showPicker ? 'Close Plan Selection' : 'Select Plan'}
          </Button>
        )}
        {showGateway && (
          <Button
            variant="outline"
            onClick={() => {
              setShowGateway(false);
              setShowPicker(true);
            }}
          >
            Back to Plans
          </Button>
        )}
      </div>

      {/* Step 1: PlanSelection */}
      {showPicker && !showGateway && (
        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
          <PlanSelection
            plans={plans}
            selectedPlan={selectedPlanId}
            onPlanSelect={handlePlanSelect}
            isLoading={isPlansLoading}
          />
          {plansError && (
            <p className="text-red-500 text-sm mt-3">Failed to load plans.</p>
          )}
        </div>
      )}

      {/* Step 2: PaymentGateway with the chosen plan */}
      {showGateway && (
        <div className="mt-4">
          <PaymentGateway initialPlanId={selectedPlanId} />
        </div>
      )}
    </Card>
  );
}
