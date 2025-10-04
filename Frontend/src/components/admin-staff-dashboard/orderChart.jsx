'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
/* ------------------------------- Formatters -------------------------------- */

const formatCurrency = (n) => {
  if (typeof n !== 'number') return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
};

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const getPaymentBadgeStyle = (status = '') => {
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'completed') return 'bg-green-100 text-green-800';
  if (s === 'refunded') return 'bg-blue-100 text-blue-800';
  if (s === 'failed' || s === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
};

/* -------------------------------- Components -------------------------------- */

const TinyBadge = ({ children, className }) => (
  <span
    className={cn('rounded px-2 py-1 text-xs whitespace-nowrap', className)}
  >
    {children}
  </span>
);

const LoadingState = () => (
  <div className="py-10 text-center text-sm text-muted-foreground">
    Loading orders…
  </div>
);

const ErrorState = ({ onRetry }) => (
  <div className="py-10 text-center text-sm text-destructive">
    Failed to load orders.
    {onRetry && (
      <Button size="sm" variant="outline" className="ml-3" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

const EmptyState = () => (
  <div className="py-10 text-center text-sm text-muted-foreground">
    No orders yet.
  </div>
);

/* ------------------------------- Data Helpers ------------------------------ */

const normalizeOrders = (apiOrders = []) => {
  return apiOrders.map((order) => {
    const firstItem = order.items?.[0];
    const extraItems = Math.max((order.items?.length || 0) - 1, 0);

    const itemsLabel = firstItem
      ? `${firstItem.itemName || 'Item'}${
          firstItem.variantName ? ` · ${firstItem.variantName}` : ''
        } ×${firstItem.quantity || 1}${
          extraItems ? ` (+${extraItems} more)` : ''
        }`
      : '—';

    return {
      id: order.orderNumber || order._id,
      itemsLabel,
      paymentStatus: order.paymentStatus || 'pending',
      total: order.totalAmount ?? 0,
      createdAt: order.createdAt,
    };
  });
};

/* ------------------------------- Main Table ------------------------------ */

export function WorkOrdersChart({ data }) {
  return (
    <Card className="transition hover:shadow-md border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-pretty">
          Work Orders (last 14 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 md:h-84 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
            <Line
              type="monotone"
              dataKey="workOrders"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WorkOrdersTable({
  orders = [],
  loading = false,
  error = false,
  onRetry,
}) {
  const router = useRouter();

  const rawOrders = Array.isArray(orders) ? orders : orders?.data || [];
  const rows = normalizeOrders(rawOrders);

  const tableHeaders = [
    { label: 'Order #', align: 'text-left' },
    { label: 'Items', align: 'text-left' },
    { label: 'Payment', align: 'text-left' },
    { label: 'Total', align: 'text-right' },
    { label: 'Created', align: 'text-right' },
  ];

  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        <Button
          onClick={() => router.push('/admin/orders')}
          variant="outline"
          className="border-primary/40 text-primary"
        >
          View all
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
              <thead className="border-b">
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
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs">{row.id}</td>
                    <td className="py-3 px-4 max-w-[280px] truncate">
                      {row.itemsLabel}
                    </td>
                    <td className="py-3 px-4">
                      <TinyBadge
                        className={getPaymentBadgeStyle(row.paymentStatus)}
                      >
                        {row.paymentStatus}
                      </TinyBadge>
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
