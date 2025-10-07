'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Users, TrendingUp, Wallet } from 'lucide-react';

import { useGetAllPaymentsInfoQuery } from '@/features/staffSalaryApi';

import { StaffCard } from '@/components/staffSalary/StaffCard';
import { PaymentDialog } from '@/app/admin/staff-saleries/PaymentDialog';
import { AdjustSalaryDialog } from '@/app/admin/staff-saleries/AdjustSalaryDialog';

// helpers
const initials = (name = '') =>
  (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const fmtMoney = (n) =>
  typeof n === 'number' && isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : 'Not set';

export default function Page() {
  // Your endpoint returns an array of users like in your example
  const {
    data: apiUsers = [],
    error,
    isLoading,
    refetch,
  } = useGetAllPaymentsInfoQuery();

  // Map backend users -> UI staff items
  const staff = useMemo(() => {
    if (!Array.isArray(apiUsers)) return [];
    return apiUsers.map((u) => {
      const raw = Number(u.baseSalaryMonthly);
      const salaryNum = Number.isFinite(raw) && raw > 0 ? raw : null;

      return {
        id: u._id,
        name: u.name || 'Unnamed',
        position: u.subRole || '',
        department: u.department || '',
        salary: salaryNum ?? 0,
        salaryUnset: salaryNum === null,
        lastPayment: u.lastPaymentDate || null, // keep null if missing
        lastPaymentUnset: !u.lastPaymentDate, // helper flag
        status: 'active',
        avatar: initials(u.name),
        email: u.email,
        phone: u.phone,
      };
    });
  }, [apiUsers]);

  // Derived stats (ignore “Not set” salaries)
  const totalMonthlyPayroll = useMemo(() => {
    if (!Array.isArray(staff)) return 0;
    return staff.reduce(
      (sum, s) => sum + (s.salaryUnset ? 0 : Number(s.salary) || 0),
      0
    );
  }, [staff]);

  const pendingPayments = 0; // you can compute this if you track it in your data

  // UI state
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payStaff, setPayStaff] = useState(null);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustStaff, setAdjustStaff] = useState(null);

  const handlePaymentClick = (member) => {
    // block payment if salary not set
    if (member?.salaryUnset) return;
    setPayStaff(member);
    setIsPayOpen(true);
  };

  const handleTopPaymentClick = () => {
    if (!selectedStaffId) return;
    const member = staff.find((s) => s.id === selectedStaffId);
    if (member && !member.salaryUnset) handlePaymentClick(member);
  };

  // These two are local UI handlers; call your mutations inside if needed
  const handlePaymentSubmit = ({ staffId, type, total }) => {
    setIsPayOpen(false);
    setPayStaff(null);
    console.log('Paid:', { staffId, type, total });
  };

  const openAdjustFor = (member) => {
    setAdjustStaff(member);
    setIsAdjustOpen(true);
  };

  const applyIncrement = (staffId, incAmount) => {
    setIsAdjustOpen(false);
    setAdjustStaff(null);
    console.log('Increment:', { staffId, incAmount });
  };

  if (isLoading) {
    return <main className="p-6 md:p-8 lg:p-12">Loading…</main>;
  }
  if (error) {
    return (
      <main className="p-6 md:p-8 lg:p-12">
        <div className="mb-3">Failed to load staff.</div>
        <Button size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 mt-6">
      <div className="mx-auto max-w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">
            Staff Salary Management
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage monthly salaries, bonuses, and one-time deductions
          </p>
        </div>

        {/* Stats */}
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
            <p className="text-3xl font-bold text-foreground">
              {staff?.length || 0}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2 justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Monthly Payroll
              </span>
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-chart-1" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              ${fmtMoney(totalMonthlyPayroll)}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2 justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Avg Monthly
              </span>
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              $
              {fmtMoney(
                Math.round(
                  totalMonthlyPayroll / Math.max(1, staff?.length || 0)
                )
              )}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2 justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Pending
              </span>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Wallet className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {pendingPayments}
            </p>
          </div>
        </div>

        {/* Quick Payment */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Quick Payment
              </h2>
              <p className="text-sm text-muted-foreground">
                Select a staff member to process payment
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:w-auto w-full">
              <Select
                value={selectedStaffId}
                onValueChange={setSelectedStaffId}
              >
                <SelectTrigger className="w-full sm:w-[280px] bg-background">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {(staff || []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-sm">
                          –{' '}
                          {s.salaryUnset
                            ? 'Not set'
                            : `$${fmtMoney(s.salary)}/mo`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleTopPaymentClick}
                disabled={
                  !selectedStaffId ||
                  !!staff.find((m) => m.id === selectedStaffId && m.salaryUnset)
                }
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(staff || []).map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              onPaymentClick={handlePaymentClick}
              onAdjustClick={openAdjustFor}
            />
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      {payStaff && (
        <PaymentDialog
          open={isPayOpen}
          onOpenChange={setIsPayOpen}
          staff={payStaff}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {/* Adjust Salary Dialog */}
      {adjustStaff && (
        <AdjustSalaryDialog
          open={isAdjustOpen}
          onOpenChange={setIsAdjustOpen}
          staff={adjustStaff}
          onApply={applyIncrement}
        />
      )}
    </main>
  );
}
