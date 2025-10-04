'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useGetAllPlansQuery, useUpdatePlanMutation } from '@/features/planApi';

/* =========================
   Small atoms
========================= */
function LimitRow({ label, value, isUnlimited = false }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-sm font-medium',
          isUnlimited ? 'text-green-600' : 'text-foreground'
        )}
      >
        {String(value)}
      </span>
    </div>
  );
}

function StatusBadge({ enabled, label }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        enabled
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-gray-50 text-gray-600 border border-gray-200'
      )}
    >
      {enabled ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

/* =========================
   Helpers to normalize plan
========================= */
const PLAN_ORDER = ['basic', 'premium', 'platinum'];

function keyForPlan(p) {
  return (
    p?.code ||
    p?.slug ||
    p?.id ||
    p?._id ||
    (p?.name ? p.name.toLowerCase().replace(/\s+/g, '-') : '')
  );
}

function labelForPlan(p) {
  return p?.name || p?.label || p?.title || 'Plan';
}

function priceForPlan(p) {
  if (typeof p?.priceMonthly === 'number') return `$${p.priceMonthly}/mo`;
  if (typeof p?.price === 'number') return `$${p.price}/mo`;
  return p?.priceLabel || p?.displayPrice || 'Free';
}

/* Fallback definitions */
const FALLBACK_LIMITS = {
  basic: {
    'Monthly Orders': 100,
    'Inventory Items': 500,
    'Staff Users': 1,
    Storage: '2 GB',
  },
  premium: {
    'Monthly Orders': 1000,
    'Inventory Items': 5000,
    'Staff Users': 5,
    Storage: '25 GB',
  },
  platinum: {
    'Monthly Orders': 'Unlimited',
    'Inventory Items': 'Unlimited',
    'Staff Users': 'Unlimited',
    Storage: 'Unlimited',
  },
};

/* Convert API plan.raw into UI-ready meta */
function extractPlanMeta(planObj) {
  const raw = planObj?.raw || {};
  const id = planObj?.id;

  // LIMITS
  let limitsList = [];
  const limits = raw.limitations || raw.limits || FALLBACK_LIMITS[id] || null;
  if (limits && typeof limits === 'object') {
    const labelMap = {
      maxStaff: 'Staff Users',
      maxInventoryItems: 'Inventory Items',
      maxUsers: 'Staff Users',
      ordersPerMonth: 'Monthly Orders',
      storageGB: 'Storage',
    };
    Object.entries(limits).forEach(([k, v]) => {
      let label = labelMap[k] || k;
      if (k === 'storageGB' && typeof v === 'number') v = `${v} GB`;
      limitsList.push({
        label,
        value: v,
        isUnlimited: String(v).toLowerCase() === 'unlimited',
      });
    });
  }

  // Price
  let priceLabel = 'Free';
  if (typeof raw.price === 'number') priceLabel = `$${raw.price}/mo`;
  else if (typeof raw.priceMonthly === 'number')
    priceLabel = `$${raw.priceMonthly}/mo`;
  else priceLabel = raw.priceLabel || planObj?.price || 'Free';

  return {
    limitsList,
    priceLabel,
  };
}

/* =========================
   Limits section
========================= */
function PlanLimits({ selectedId, plans }) {
  const selected = plans.find((p) => p.id === selectedId) || plans[0];
  const { limitsList, priceLabel } = extractPlanMeta(selected || {});

  return (
    <div className="space-y-4">
      {/* Current Plan Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{selected.label}</div>
          <div className="text-sm text-muted-foreground">{priceLabel}</div>
        </div>
        <StatusBadge enabled={selected.id !== 'basic'} label="Active" />
      </div>

      {/* Limits Grid */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="grid gap-3">
          {limitsList?.length ? (
            limitsList.map((row) => (
              <LimitRow
                key={row.label}
                label={row.label}
                value={row.value}
                isUnlimited={row.isUnlimited}
              />
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              No limitation data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main component
========================= */
export default function PlanAccessCardUnlocked({
  planId = 'premium',
  onPlanSaved,
  onUpgradeRequested,
}) {
  const [localPlan, setLocalPlan] = React.useState(planId);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    setLocalPlan(planId);
    setTouched(false);
  }, [planId]);

  const { data: apiPlans = [], isLoading, isError } = useGetAllPlansQuery();
  const [updatePlan, { isLoading: updating }] = useUpdatePlanMutation();

  // Normalize incoming list
  const plans = React.useMemo(() => {
    const list = Array.isArray(apiPlans) ? apiPlans : apiPlans?.data || [];
    if (list.length) {
      return list.map((p) => ({
        id: keyForPlan(p),
        label: labelForPlan(p),
        price: priceForPlan(p),
        raw: p,
      }));
    }
    return [
      {
        id: 'basic',
        label: 'Basic',
        price: 'Free',
        raw: { limitations: FALLBACK_LIMITS.basic },
      },
      {
        id: 'premium',
        label: 'Premium',
        price: '$49/mo',
        raw: { limitations: FALLBACK_LIMITS.premium },
      },
      {
        id: 'platinum',
        label: 'Platinum',
        price: '$99/mo',
        raw: { limitations: FALLBACK_LIMITS.platinum },
      },
    ];
  }, [apiPlans]);

  const changed = touched && localPlan !== planId;

  const onPick = (id) => {
    setLocalPlan(id);
    setTouched(true);
  };

  const savePlan = async () => {
    try {
      await updatePlan({ plan: localPlan }).unwrap();
      onPlanSaved?.(localPlan);
      setTouched(false);
    } catch (e) {
      console.error('Failed to update plan', e);
    }
  };

  // Compute next plan for upgrade
  const nextPlanId = React.useMemo(() => {
    const idx = PLAN_ORDER.indexOf(localPlan);
    if (idx !== -1 && idx < PLAN_ORDER.length - 1) return PLAN_ORDER[idx + 1];
    return null;
  }, [localPlan]);

  const nextPlan = nextPlanId ? plans.find((p) => p.id === nextPlanId) : null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-chart-5" />
          <CardTitle className="text-lg font-semibold">Current Plan</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Limits */}
        <PlanLimits selectedId={localPlan} plans={plans} />

        {/* Plan Selector */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Change Plan</div>
          <div className="grid grid-cols-3 gap-3">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p.id)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-all hover:shadow-sm',
                  localPlan === p.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card'
                )}
              >
                <div className="text-sm font-semibold">{p.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.price}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            {changed ? 'Plan selection changed' : 'Current plan active'}
          </div>
          <div className="flex gap-2">
            {nextPlan && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocalPlan(nextPlan.id);
                  setTouched(true);
                }}
                className="flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Upgrade
              </Button>
            )}
            <Button
              size="sm"
              disabled={!changed || updating}
              onClick={savePlan}
            >
              {updating ? 'Saving...' : 'Update Plan'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
