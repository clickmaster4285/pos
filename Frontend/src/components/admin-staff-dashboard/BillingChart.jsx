'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

/* ----------------- helpers (same rules you’re using elsewhere) ----------------- */

// local YYYY-MM-DD without timezone shifts
const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const labelDay = (d) =>
  d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });

const N = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const lineRevenue = (it) =>
  Math.max(N(it.quantity) * N(it.price) - N(it.refundAmount), 0);

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
              fill="var(--chart-5)"
              radius={[6, 6, 0, 0]}
            />
            {/* Profit as a line overlay */}
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="var(--chart-5)"
              strokeWidth={2}
              dot={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
