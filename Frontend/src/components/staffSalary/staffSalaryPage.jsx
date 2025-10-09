'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
//
import { useContext } from 'react';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
//
import {
  useCreatePaymentMutation,
  useGetAllPaymentsInfoQuery,
  useUpdateSalaryMutation,
  useGetAllPaymentLogQuery,
} from '@/features/staffSalaryApi';

import { StaffCard } from './StaffCard';
import { PaymentDialog } from './PaymentDialog';
import { AdjustSalaryDialog } from './AdjustSalaryDialog';
import StaffSummarySheet from './StaffSummarySheet';
import CompanySummaryDialog from './CompanySummaryDialog';

import StatsBar from './StatsBar';
import SearchFilters from './SearchFilters';
import ActivityLog from './ActivityLog';

// helpers
const initials = (name = '') =>
  (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function StaffSalaryPage() {
  const {
    data: apiUsers = [],
    error,
    isLoading,
    refetch,
  } = useGetAllPaymentsInfoQuery();

  const [updateSalary] = useUpdateSalaryMutation();
  const [createPayment] = useCreatePaymentMutation();

  const { data: items = [] } = useGetAllPaymentLogQuery();
  // Map backend -> UI
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
        lastPayment: u.lastPaymentDate || null,
        lastPaymentUnset: !u.lastPaymentDate,
        status: 'active',
        avatar: initials(u.name),
        email: u.email,
        phone: u.phone,
      };
    });
  }, [apiUsers]);

  // Stats

  const { totalSalaryPaid, totalBonus, totalDeductions } = useMemo(() => {
    let salary = 0;
    let bonus = 0;
    let dec = 0;

    for (const r of items || []) {
      salary += Number(r?.baseSalary || 0);
      bonus += Number(r?.bonusAmount || 0);
      dec += Number(r?.decrementAmount || 0);
    }
    return { totalSalaryPaid: salary, totalBonus: bonus, totalDeductions: dec };
  }, [items]);

  // UI state
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payStaff, setPayStaff] = useState(null);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustStaff, setAdjustStaff] = useState(null);

  // Search state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(null);

  const normalize = (s) =>
    String(s || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  // filtering
  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (staff || []).filter((s) => {
      const matchesSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.position?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q);

      const matchesDept = !department || normalize(s.department) === department;
      return matchesSearch && matchesDept;
    });
  }, [staff, search, department]);

  // Card handlers
  const handlePaymentClick = (member) => {
    if (member?.salaryUnset) return;
    setPayStaff(member);
    setIsPayOpen(true);
  };

  const openAdjustFor = (member) => {
    setAdjustStaff(member);
    setIsAdjustOpen(true);
  };

  // inside StaffSalaryPage

  const handlePaymentSubmit = async ({
    staffId,
    paymentType, // "salary"
    paymentMethod, // <-- comes from the dialog: "cash" | "card" | "easypaisa" | custom text
    bonusAmount = 0,
    decrementAmount = 0,
    notes,
    cycleMonth,
  }) => {
    try {
      const body = {
        staffId,
        paymentType, // keep as "salary"
        paymentMethod, // <-- keep this; default is "cash"
        bonusAmount,
        decrementAmount,
        notes: (notes || '').trim(),
        cycleMonth,
      };

      await createPayment(body).unwrap();
      setIsPayOpen(false);
      setPayStaff(null);
      await refetch();
    } catch (err) {
      console.error('Create payment failed:', err);
    }
  };

  const applyIncrement = async (staffId, incAmount) => {
    try {
      const m = staff.find((s) => s.id === staffId);
      const current = Number(m?.salary || 0);
      const add = Number(incAmount || 0);
      const newSalary = Math.max(0, current + add);

      await updateSalary({ staffId, newSalary }).unwrap();

      setIsAdjustOpen(false);
      setAdjustStaff(null);
      await refetch();
    } catch (err) {
      console.error('Increment failed:', err);
    }
  };

  //for company summary
  const [companySummaryOpen, setCompanySummaryOpen] = useState(false);

  //for history
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryStaffId, setSummaryStaffId] = useState(null);

  // open helper
  const openStaffSummary = (id) => {
    setSummaryStaffId(id);
    setSummaryOpen(true);
  };

  //access control
  const { user } = useContext(AuthContext) || {};

  const createPaymentPermission = user?.permissions?.createPayment;
  const updateSalaryPermission = user?.permissions?.updateSalary;
  const deletePaymentPermission = user?.permissions?.deletePayment;
  const staffSummaryPermission = user?.permissions?.staffSummary;
  const viewActiveLogPermission = user?.permissions?.viewActiveLog;
  const viewCompanySummaryPermission = user?.permissions?.staffUpdate;

  if (isLoading) return <main className="p-6 md:p-8 lg:p-12">Loading…</main>;
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
        <StatsBar
          totalStaff={staff?.length || 0}
          totalMonthlyPayroll={totalSalaryPaid}
          totalBonus={totalBonus}
          totalDeductions={totalDeductions}
        />

        {/* Search & filters */}
        <SearchFilters
          search={search}
          onSearchChange={setSearch}
          department={department}
          onDepartmentChange={setDepartment}
          apiUsers={apiUsers}
          onCompanySummary={() => setCompanySummaryOpen(true)}
          viewCompanySummaryPermission={viewCompanySummaryPermission}
        />

        {/* Split view: staff grid (8) + activity log (4) */}
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(filteredStaff || []).map((member) => (
                <StaffCard
                  key={member.id}
                  staff={member}
                  onPaymentClick={handlePaymentClick}
                  onAdjustClick={openAdjustFor}
                  openStaffSummary={openStaffSummary}
                  createPaymentPermission={createPaymentPermission}
                  updateSalaryPermission={updateSalaryPermission}
                  staffSummaryPermission={staffSummaryPermission}
                />
              ))}
            </div>
          </section>

          {/* Right: activity log */}
          <ActivityLog
            limit={25}
            page={1}
            viewActiveLogPermission={viewActiveLogPermission}
            deletePaymentPermission={deletePaymentPermission}
          />
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
      <CompanySummaryDialog
        open={companySummaryOpen}
        onOpenChange={setCompanySummaryOpen}
        logs={items}
        companyName="Alpha AutoMotive Industry"
      />
      <StaffSummarySheet
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        staffId={summaryStaffId}
      />
    </main>
  );
}
