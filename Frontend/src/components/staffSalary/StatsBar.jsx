'use client';

import React from 'react';
import { DollarSign, Users, TrendingUp, Wallet, TrendingDown } from 'lucide-react';

export default function StatsBar({
  totalStaff = 0,
  totalMonthlyPayroll = 0,
  totalBonus = 0,
  totalDeductions = 0,
}) {
  const fmtMoney = (n) =>
    typeof n === 'number' && isFinite(n)
      ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : 'Not set';
  const totalPaid = totalMonthlyPayroll + totalBonus - totalDeductions;
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2 justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Staff
          </span>
          <div className="p-2 bg-chart-2/10 rounded-lg">
            <Users className="h-5 w-5 text-chart-2" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground">{totalStaff}</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2 justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Paid
          </span>
          <div className="p-2 bg-chart-3/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-chart-3" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground">
          ${fmtMoney(Math.round(totalPaid))}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2 justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Bonus Paid
          </span>
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Wallet className="h-5 w-5 text-destructive" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground">{totalBonus}</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2 justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Deductions
          </span>
          <div className="p-2 bg-chart-1/10 rounded-lg">
            <TrendingDown className="h-5 w-5 text-chart-1" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground">
          ${fmtMoney(totalDeductions)}
        </p>
      </div>
    </div>
  );
}
