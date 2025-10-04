'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function RevenueProfitComparisonChart({ data }) {
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="transition hover:shadow-md border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-pretty">
          Revenue & Profit (last 14 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 md:h-84 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value),
                name === 'Revenue' ? 'Revenue' : 'Profit',
              ]}
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                borderRadius: '6px',
              }}
            />
            <Legend />
            {/* Revenue Line */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-1)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'var(--chart-1)' }}
            />
            {/* Profit Line */}
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-3)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'var(--chart-3)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
