'use client';

import React, { useMemo, useState } from 'react';
import { useGetAllPlansQuery } from '@/features/planApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Check,
  Package,
  Users,
  Building2,
  BarChart3,
  FileText,
  Truck,
  Search,
  SlidersHorizontal,
  List,
  Grid3X3,
  Sparkles,
  Info,
} from 'lucide-react';

/* -------------------------- labels & icon maps -------------------------- */

const featureIcons = {
  analytics: BarChart3,
  reports: FileText,
  inventory_management: Package,
  vendor_management: Building2,
  order_tracking: Truck,
};
const featureLabels = {
  analytics: 'Analytics',
  reports: 'Reports',
  inventory_management: 'Inventory',
  vendor_management: 'Vendors',
  order_tracking: 'Order Tracking',
};

/* ------------------------------- helpers ------------------------------- */

const fmtMoney = (n) =>
  typeof n === 'number'
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n)
    : '—';

const daysLabel = (d) => (d ? `${d} ${d === 1 ? 'day' : 'days'}` : '—');

const byValuePerDay = (a, b) =>
  (a.price ?? Infinity) / Math.max(1, a.validateDays ?? 1) -
  (b.price ?? Infinity) / Math.max(1, b.validateDays ?? 1);

/* ------------------------------ toolbar ------------------------------ */

function Toolbar({
  view,
  setView,
  search,
  setSearch,
  sortBy,
  setSortBy,
  onlyActive,
  setOnlyActive,
  featureFilter,
  setFeatureFilter,
  total,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans…"
            className="pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_asc">Price ↑</SelectItem>
              <SelectItem value="price_desc">Price ↓</SelectItem>
              <SelectItem value="name_asc">Name A–Z</SelectItem>
              <SelectItem value="name_desc">Name Z–A</SelectItem>
              <SelectItem value="duration_desc">Duration (days)</SelectItem>
              <SelectItem value="value_desc">Best value</SelectItem>
            </SelectContent>
          </Select>

          <Select value={featureFilter} onValueChange={setFeatureFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All features</SelectItem>
              <SelectItem value="reports">Reports</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="inventory_management">Inventory</SelectItem>
              <SelectItem value="vendor_management">Vendors</SelectItem>
              <SelectItem value="order_tracking">Order Tracking</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={onlyActive ? 'default' : 'outline'}
            onClick={() => setOnlyActive((v) => !v)}
            size="sm"
          >
            {onlyActive ? 'Active only' : 'All plans'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground hidden md:block"></div>
      </div>
    </div>
  );
}

/* ------------------------------ plan cards ----------------------------- */

function PlanCard({ plan, onOpen, isBestValue }) {
  const lim = plan?.limitations || {};
  const feat = Array.isArray(lim.features) ? lim.features : [];
  return (
    <Card
      className="h-full hover:shadow-lg transition-all border-border cursor-pointer group"
      onClick={() => onOpen(plan)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {plan.name}
            {isBestValue ? (
              <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Sparkles className="h-3 w-3" />
                Best value
              </Badge>
            ) : null}
          </CardTitle>
          {plan.isActive ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          )}
        </div>

        <div className="flex items-end gap-2">
          <div className="text-3xl font-bold text-primary leading-none">
            {fmtMoney(plan.price)}
          </div>
          {plan.validateDays ? (
            <div className="text-xs text-muted-foreground pb-1">
              / {daysLabel(plan.validateDays)}
            </div>
          ) : null}
        </div>

        {plan.description ? (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {plan.description}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{lim.maxStaff ?? '—'} staff</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span>{lim.maxInventoryItems ?? '—'} items</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>{lim.maxVendors ?? '—'} vendors</span>
          </div>
        </div>

        {feat.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {feat.slice(0, 4).map((f) => {
              const Icon = featureIcons[f];
              const label = featureLabels[f] || f;
              return (
                <Badge key={f} variant="secondary" className="gap-1">
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                  {label}
                </Badge>
              );
            })}
            {feat.length > 4 ? (
              <Badge variant="outline">+{feat.length - 4} more</Badge>
            ) : null}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            No feature list provided
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-muted-foreground">
            Created:{' '}
            <span className="text-foreground">
              {plan.createdAt
                ? new Date(plan.createdAt).toLocaleDateString()
                : '—'}
            </span>
            {' · '}
            Updated:{' '}
            <span className="text-foreground">
              {plan.updatedAt
                ? new Date(plan.updatedAt).toLocaleDateString()
                : '—'}
            </span>
          </div>
          {/* <Button
            size="sm"
            variant="outline"
            className="group-hover:border-primary"
          >
            View details
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- table -------------------------------- */

function PlanTable({ plans, onOpen }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3">Plan</th>
            <th className="text-left p-3">Price</th>
            <th className="text-left p-3">Duration</th>
            <th className="text-left p-3">Staff</th>
            <th className="text-left p-3">Items</th>
            <th className="text-left p-3">Vendors</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => {
            const lim = p.limitations || {};
            return (
              <tr
                key={p._id || p.name}
                className="border-t hover:bg-muted/50 cursor-pointer"
                onClick={() => onOpen(p)}
              >
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{fmtMoney(p.price)}</td>
                <td className="p-3">{daysLabel(p.validateDays)}</td>
                <td className="p-3">{lim.maxStaff ?? '—'}</td>
                <td className="p-3">{lim.maxInventoryItems ?? '—'}</td>
                <td className="p-3">{lim.maxVendors ?? '—'}</td>
                <td className="p-3">
                  {p.isActive ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="p-3">
                  {p.updatedAt
                    ? new Date(p.updatedAt).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- quick view sheet ---------------------------- */

function PlanQuickView({ open, onOpenChange, plan, onAssign, onPurchase }) {
  const lim = plan?.limitations || {};
  const features = Array.isArray(lim.features) ? lim.features : [];

  const perDay =
    plan?.price != null && plan?.validateDays
      ? plan.price / Math.max(1, plan.validateDays)
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* wider, responsive sheet */}
      <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {plan?.name || '—'}
            {plan?.isActive ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Inactive
              </Badge>
            )}
          </SheetTitle>
          {plan?.description ? (
            <SheetDescription>{plan.description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* pricing */}
          <div className="flex items-end gap-3">
            <div className="text-4xl font-extrabold text-primary">
              {fmtMoney(plan?.price)}
            </div>
            <div className="text-sm text-muted-foreground pb-1">
              / {daysLabel(plan?.validateDays)}
              {perDay != null ? (
                <span className="ml-2 text-xs">
                  (~{fmtMoney(Math.round(perDay))}/day)
                </span>
              ) : null}
            </div>
          </div>

          {/* limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3  gap-3">
            <div className="rounded-lg border p-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-medium">{lim.maxStaff ?? '—'}</div>
                <div className="text-xs text-muted-foreground">Staff</div>
              </div>
            </div>
            <div className="rounded-lg border p-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-medium">
                  {lim.maxInventoryItems ?? '—'}
                </div>
                <div className="text-xs text-muted-foreground">Items</div>
              </div>
            </div>
            <div className="rounded-lg border p-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-medium">{lim.maxVendors ?? '—'}</div>
                <div className="text-xs text-muted-foreground">Vendors</div>
              </div>
            </div>
          </div>

          {/* features */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Included features
            </div>
            {features.length ? (
              <div className="flex flex-wrap gap-2">
                {features.map((f) => {
                  const Icon = featureIcons[f];
                  const label = featureLabels[f] || f;
                  return (
                    <Badge key={f} variant="secondary" className="gap-1">
                      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                      {label}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                No features listed for this plan.
              </div>
            )}
          </div>

          {/* meta */}
          <div className="rounded-lg border p-3 text-xs text-muted-foreground">
            <div>
              Plan ID:{' '}
              <span className="font-mono text-foreground">
                {plan?._id || '—'}
              </span>
            </div>
            <div className="mt-1">
              Created:{' '}
              <span className="text-foreground">
                {plan?.createdAt
                  ? new Date(plan.createdAt).toLocaleString()
                  : '—'}
              </span>
            </div>
            <div>
              Updated:{' '}
              <span className="text-foreground">
                {plan?.updatedAt
                  ? new Date(plan.updatedAt).toLocaleString()
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          {plan ? (
            <>
              <Button onClick={() => onAssign?.(plan)}>Assign to user</Button>
              <Button variant="outline" onClick={() => onPurchase?.(plan)}>
                Purchase / Upgrade
              </Button>
            </>
          ) : (
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------ main module ------------------------------ */

export default function PlansModule() {
  const { data: plans = [], isLoading, error } = useGetAllPlansQuery();

  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [onlyActive, setOnlyActive] = useState(true);
  const [featureFilter, setFeatureFilter] = useState('all');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const openSheet = (plan) => {
    setSelectedPlan(plan);
    setIsSheetOpen(true);
  };

  // compute "best value" plan (lowest $/day among visible)
  const filtered = useMemo(() => {
    let list = Array.isArray(plans) ? [...plans] : [];

    if (onlyActive) list = list.filter((p) => p.isActive);

    if (featureFilter !== 'all') {
      list = list.filter((p) =>
        (p.limitations?.features || []).includes(featureFilter)
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const description = (p.description || '').toLowerCase();
        return name.includes(q) || description.includes(q);
      });
    }

    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price_desc':
        list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'name_asc':
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'duration_desc':
        list.sort((a, b) => (b.validateDays ?? 0) - (a.validateDays ?? 0));
        break;
      case 'value_desc':
        list.sort(byValuePerDay);
        break;
      default:
        break;
    }

    return list;
  }, [plans, search, sortBy, onlyActive, featureFilter]);

  // mark best value among currently visible
  const bestValueId = useMemo(() => {
    const sorted = [...filtered].sort(byValuePerDay);
    return sorted[0]?._id || sorted[0]?.name || null;
  }, [filtered]);

  const onAssign = (plan) => {
    // hook into your staff assignment flow
    console.log('Assign →', plan?.name);
  };
  const onPurchase = (plan) => {
    // hook into your checkout flow
    console.log('Purchase →', plan?.name);
  };

  return (
    <div className="space-y-6  p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance mt-4">
            Plan Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription plans for your automotive software platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'card' ? 'default' : 'outline'}
            onClick={() => setView('card')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            onClick={() => setView('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Toolbar
        view={view}
        setView={setView}
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onlyActive={onlyActive}
        setOnlyActive={setOnlyActive}
        featureFilter={featureFilter}
        setFeatureFilter={setFeatureFilter}
        total={filtered.length}
      />

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Loading plans…
        </Card>
      ) : error ? (
        <Card className="p-8 text-center text-sm text-destructive">
          Failed to load plans.
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">No plans found</div>
        </Card>
      ) : view === 'card' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <PlanCard
              key={p._id || p.name || i}
              plan={p}
              onOpen={openSheet}
              isBestValue={(p._id || p.name) === bestValueId}
            />
          ))}
        </div>
      ) : (
        <PlanTable plans={filtered} onOpen={openSheet} />
      )}

      {/* <PlanQuickView
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        plan={selectedPlan}
        onAssign={onAssign}
        onPurchase={onPurchase}
      /> */}
    </div>
  );
}
