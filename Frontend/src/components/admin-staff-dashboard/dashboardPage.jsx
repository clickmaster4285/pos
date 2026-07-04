'use client';

import React from 'react';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { useContext } from 'react';
import { AuthContext } from '@/components/auth/SecureAuthProvider';

import { useGetOrdersQuery } from '@/features/orderApi';
import { useGetBillsQuery } from '@/features/billingApi';
import { useGetAllProductsQuery } from '@/features/productApi';

import { WorkOrdersTable, WorkOrdersChart } from './orderChart';
import { ProductTable } from './productTable';

import { BillsTable } from './BillsTable';
import { BillingChart } from './BillingChart';

// Charts & Plan components
import RevenueChart from './RevenueChart';
import ProfitChart from './ProfitChart';
import RevenuePie from './RevenuePie';
import PlanAccessCardUnlocked from './PlanAccessCardUnlocked';

// Finance helpers (unchanged)
import {
  buildSeriesFromOrdersAndBills,
  calcMTDFromOrdersAndBills,
  buildRevenuePieFromBoth,
} from './financeSeries';

/* ------------------------------ KPI Cards ------------------------------ */
function StatCard({
  title,
  value,
  hint,
  Icon,
  accent = 'text-chart-1',
  className,
}) {
  return (
    <Card
      className={cn(
        'bg-card border-border hover:shadow-md transition-shadow',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? <Icon className={cn('h-5 w-5', accent)} /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value ?? <span className="opacity-40">—</span>}
        </div>
        <div className="text-xs text-muted-foreground">
          {hint ?? 'Snapshot'}
        </div>
      </CardContent>
    </Card>
  );
}

function KPISection({
  k,
  isRecieptionist,
  productAccess,
  isAdmin,
  BillAcess,
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {isRecieptionist && (
        <StatCard
          title="Total Orders"
          value={k.totalOrders}
          Icon={Package}
          accent="text-chart-1"
        />
      )}
      {BillAcess && (
        <StatCard
          title="Total Bills"
          value={k.totalBills}
          Icon={Receipt}
          accent="text-chart-2"
        />
      )}
      {productAccess && (
        <StatCard
          title="Low-Stock Items"
          value={k.lowStockItems}
          hint="Below min level"
          Icon={AlertTriangle}
          accent="text-chart-4"
        />
      )}
      {isAdmin && (
        <>
          <StatCard
            title="Profit (MTD)"
            value={`$${Intl.NumberFormat().format(k.profitMTD)}`}
            Icon={TrendingUp}
            accent="text-chart-3"
          />
          <StatCard
            title="Revenue (MTD)"
            value={`$${Intl.NumberFormat().format(k.revenueMTD)}`}
            Icon={DollarSign}
            accent="text-chart-5"
          />
        </>
      )}
    </section>
  );
}

/* ------------------------------ Product helpers ------------------------------ */

// Normalize product payload shape
function normalizeProduct(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (raw && typeof raw === 'object' && raw.variants) return [raw];
  return [];
}

// Count variants that are low on stock (qty <= lowStockThreshold)
// Falls back to item-level fields if variants missing.
function countLowStock(productList) {
  let count = 0;
  for (const item of productList) {
    const variants = Array.isArray(item?.variants) ? item.variants : null;
    if (variants && variants.length) {
      for (const v of variants) {
        const qty = Number.isFinite(+v?.quantity) ? +v.quantity : 0;
        const thr = Number.isFinite(+v?.lowStockThreshold)
          ? +v.lowStockThreshold
          : null;
        if (thr !== null && qty <= thr) count += 1;
      }
    } else {
      const qty = Number.isFinite(+item?.quantity) ? +item.quantity : 0;
      const thrA = Number.isFinite(+item?.lowStockThreshold)
        ? +item.lowStockThreshold
        : null;
      const thrB = Number.isFinite(+item?.min) ? +item.min : null;
      const thr = thrA ?? thrB;
      if (thr !== null && qty <= thr) count += 1;
    }
  }
  return count;
}

/* --------------------------------- Page ---------------------------------- */
export default function AdminDashboard() {
  // Orders
  const {
    data: ordersRaw = [],
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    isError: ordersError,
    refetch: refetchOrders,
  } = useGetOrdersQuery();
  const orders = Array.isArray(ordersRaw) ? ordersRaw : ordersRaw?.data || [];

  // Bills (sales / POS)
  const {
    data: billsRaw = [],
    isLoading: billsLoading,
    isFetching: billsFetching,
    isError: billsError,
    refetch: refetchBills,
  } = useGetBillsQuery();
  const bills = Array.isArray(billsRaw) ? billsRaw : billsRaw?.data || [];

  // Product (for low-stock KPI)
  const { data: productRaw = [] } = useGetAllProductsQuery();
  const productList = React.useMemo(
    () => normalizeProduct(productRaw),
    [productRaw]
  );
  const lowStockItems = React.useMemo(
    () => countLowStock(productList),
    [productList]
  );

  // Series + KPIs + Pie (Orders + Bills)
  const series14 = React.useMemo(
    () => buildSeriesFromOrdersAndBills(orders, bills, 14),
    [orders, bills]
  );

  const { revenue: revenueMTD, profit: profitMTD } = React.useMemo(
    () => calcMTDFromOrdersAndBills(orders, bills),
    [orders, bills]
  );

  const pieData = React.useMemo(
    () => buildRevenuePieFromBoth(orders, bills),
    [orders, bills]
  );

  // KPI data from APIs
  const k = React.useMemo(
    () => ({
      totalOrders: orders.filter((o) => !o?.deleted).length,
      totalBills: bills.filter((b) => !b?.deleted).length,
      lowStockItems,
      profitMTD: Math.max(0, Math.trunc(profitMTD)),
      revenueMTD: Math.max(0, Math.trunc(revenueMTD)),
    }),
    [orders, bills, lowStockItems, profitMTD, revenueMTD]
  );

  const [planId, setPlanId] = React.useState('premium');

  //acess control

  const { user } = useContext(AuthContext) || {};

  const productAccess = user?.permissions?.manageProduct;

  const BillAcess = user?.permissions?.viewBilling;
  const PlanManangementAccess = user?.permissions?.managePlans;
  const isAdmin = user?.role === 'admin';
  const isRecieptionist =
    user?.subRole === 'receptionist' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
            Automotive Dashboard
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Comprehensive oversight and management of your automotive operations
            ecosystem
          </p>
        </div>

        {/* KPIs (now fully dynamic) */}
        <KPISection
          k={k}
          isAdmin={isAdmin}
          productAccess={productAccess}
          isRecieptionist={isRecieptionist}
          BillAcess={BillAcess}
        />

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left: charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders drive workOrders line; Bills do not affect this count */}

            {isAdmin && (
              <>
                <RevenueChart data={series14} />
                {/* <ProfitChart data={series14} /> */}
              </>
            )}
            {/* {isRecieptionist && <WorkOrdersChart data={series14} />} */}

            {BillAcess && <BillingChart bills={bills} />}
          </div>

          {/* Right: cards */}
          <div className="space-y-6">
            {/* {PlanManangementAccess && (
              <PlanAccessCardUnlocked
                planId={planId}
                onPlanSaved={(p) => setPlanId(p)}
              />
            )} */}

            {/* Revenue pie breakdown (Orders + Bills) */}
            {(isRecieptionist || BillAcess) && <RevenuePie data={pieData} />}

            {/* Orders table (your existing child) */}
            {/* {isRecieptionist && (
              <WorkOrdersTable
                orders={orders}
                loading={ordersLoading || ordersFetching}
                error={ordersError}
                onRetry={refetchOrders}
              />
            )} */}

            {/* Bills table (new) */}
            {BillAcess && (
              <BillsTable
                bills={bills}
                loading={billsLoading || billsFetching}
                error={billsError}
                onRetry={refetchBills}
              />
            )}

            {/* Product table (unchanged) */}
            {productAccess && <ProductTable />}
          </div>
        </div>

        <footer className="py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Automotive ERP. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
