'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Helper functions
const N = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const lineRevenue = (it) =>
  Math.max(N(it.quantity) * N(it.price) - N(it.refundAmount), 0);

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString();
};

const StatusBadge = ({ status }) => {
  const statusMap = {
    paid: {
      label: 'Paid',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    pending: {
      label: 'Pending',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    draft: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const normalizedStatus = String(status).toLowerCase();
  const statusConfig = statusMap[normalizedStatus] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
        statusConfig.className
      )}
    >
      {statusConfig.label}
    </span>
  );
};

// Loading State Component
const LoadingState = () => (
  <div className="py-12 text-center">
    <RefreshCw className="h-8 w-8 mx-auto mb-3 text-muted-foreground animate-spin" />
    <p className="text-sm text-muted-foreground">Loading bills...</p>
  </div>
);

// Error State Component
const ErrorState = ({ onRetry }) => (
  <div className="py-12 text-center">
    <div className="text-destructive mb-3">
      <RefreshCw className="h-8 w-8 mx-auto" />
    </div>
    <p className="text-sm text-destructive mb-4">Failed to load bills</p>
    {onRetry && (
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="border-destructive text-destructive hover:bg-destructive/10"
      >
        Try Again
      </Button>
    )}
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="py-12 text-center">
    <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
    <p className="text-sm text-muted-foreground">No bills found</p>
    <p className="text-xs text-muted-foreground mt-1">
      Bills will appear here once created
    </p>
  </div>
);

export function BillsTable({
  bills = [],
  loading = false,
  error = false,
  onRetry,
}) {
  const rows = React.useMemo(() => {
    const list = Array.isArray(bills) ? bills : bills?.data || [];
    return list.map((bill) => {
      const firstItem = bill.items?.[0];
      const extraItems = Math.max((bill.items?.length || 0) - 1, 0);

      const itemsLabel = firstItem
        ? `${firstItem.itemName || 'Item'}${
            firstItem.variantName ? ` · ${firstItem.variantName}` : ''
          } ×${firstItem.quantity || 1}${
            extraItems ? ` (+${extraItems} more)` : ''
          }`
        : '—';

      const total = Array.isArray(bill.items)
        ? bill.items.reduce((acc, item) => acc + lineRevenue(item), 0)
        : N(bill.subtotal || bill.total);

      return {
        id: bill.billNumber || bill._id,
        itemsLabel,
        status: bill.status || 'draft',
        total,
        createdAt: bill.createdAt,
      };
    });
  }, [bills]);

  const tableHeaders = [
    { label: 'Bill #', align: 'text-left' },
    { label: 'Items', align: 'text-left' },
    { label: 'Status', align: 'text-left' },
    { label: 'Total', align: 'text-right' },
    { label: 'Date', align: 'text-right' },
  ];
  const router = useRouter();
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Recent Bills</CardTitle>
          <p className="text-sm text-muted-foreground">
            Point of Sale transactions
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/billing')}
          disabled={loading}
          className="border-primary/40 text-primary"
        >
          Manage
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {/* States */}
        {loading && <LoadingState />}
        {error && <ErrorState onRetry={onRetry} />}
        {!loading && !error && rows.length === 0 && <EmptyState />}

        {/* Table */}
        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b ">
                <tr className="text-muted-foreground">
                  {tableHeaders.map((header, index) => (
                    <th
                      key={index}
                      className={`py-3 px-4 font-medium ${header.align}`}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs">{row.id}</td>
                    <td className="py-3 px-4 max-w-[280px]">
                      <div className="truncate" title={row.itemsLabel}>
                        {row.itemsLabel}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(row.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts';

const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const labelDay = (d) =>
  d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });

const lineCOGS = (it) => Math.max(N(it.quantity) * N(it.costPrice), 0);

const isCountableBill = (b, includePending) => {
  const s = String(b?.status || b?.paymentStatus || '').toLowerCase();
  return includePending
    ? ['paid', 'completed', 'partially_paid', 'pending'].includes(s)
    : ['paid', 'completed', 'partially_paid'].includes(s);
};

const seedDays = (days = 14) => {
  const today = new Date();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push({
      key: ymdLocal(d),
      day: labelDay(d),
      bills: 0,
      revenue: 0,
      profit: 0,
    });
  }
  return out;
};

// build daily series from bills (items only; tax not counted in revenue/profit)
function buildBillingSeries(bills = [], days = 14, includePending = true) {
  const list = Array.isArray(bills) ? bills : bills?.data || [];
  const base = seedDays(days);
  const idx = Object.fromEntries(base.map((b, i) => [b.key, i]));

  for (const b of list) {
    if (!b?.createdAt) continue;
    const d = new Date(b.createdAt);
    d.setHours(0, 0, 0, 0);
    const key = ymdLocal(d);
    const i = idx[key];
    if (i === undefined) continue;

    // count bill volume per day (optional)
    base[i].bills += 1;

    if (!isCountableBill(b, includePending)) continue;

    // items-only revenue and cogs
    let rev = 0;
    let cogs = 0;
    for (const it of b.items || []) {
      rev += lineRevenue(it);
      cogs += lineCOGS(it);
    }
    // subtract any aggregated refunds at bill level
    rev = Math.max(rev - N(b?.refundDetails?.totalRefundAmount), 0);

    base[i].revenue += rev;
    base[i].profit += Math.max(rev - cogs, 0);
  }

  return base;
}

/* ---------------------------------- chart ---------------------------------- */

export function BillingChart({
  bills = [],
  days = 14,
  includePending = true,
  title = 'Billing (last 14 days)',
}) {
  const data = React.useMemo(
    () => buildBillingSeries(bills, days, includePending),
    [bills, days, includePending]
  );

  const fmtMoney = (n) =>
    typeof n === 'number'
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(n)
      : '—';

  return (
    <Card className="transition hover:shadow-md border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-pretty">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80 md:h-84 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" />
            <YAxis
              stroke="var(--muted-foreground)"
              tickFormatter={(v) => fmtMoney(v)}
            />
            <Tooltip
              formatter={(val, key) =>
                key === 'revenue' || key === 'profit' ? fmtMoney(val) : val
              }
              labelStyle={{ color: 'var(--foreground)' }}
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
            {/* Revenue as bars */}
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill="var(--chart-2)"
              radius={[6, 6, 0, 0]}
            />
            {/* Profit as a line overlay */}
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
