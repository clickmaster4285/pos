'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Gift,
  TrendingDown,
  Clock,
  MoreVertical,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  useGetAllPaymentLogQuery,
  useDeleteSalaryMutation,
} from '@/features/staffSalaryApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';

const fmtMoney = (n) =>
  typeof n === 'number' && isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : 'Not set';

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

const ActionIcon = ({ action }) => {
  if (action === 'bonus') return <Gift className="h-4 w-4" />;
  if (action === 'decrement') return <TrendingDown className="h-4 w-4" />;
  return <DollarSign className="h-4 w-4" />; // salary
};

const ActionBadge = ({ action }) => {
  if (action === 'bonus') return <Badge variant="secondary">Bonus</Badge>;
  if (action === 'decrement')
    return <Badge variant="destructive">Decrement</Badge>;
  return <Badge>Salary</Badge>;
};

export default function ActivityLog({
  limit = 25,
  page = 1,
  title = 'Recent Payroll Activity',
  viewActiveLogPermission,
  deletePaymentPermission,
}) {
  // companyId auto-appended by your baseQuery wrapper
  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllPaymentLogQuery({ limit, page });
  const [deleteSalary, { isLoading: deleting }] = useDeleteSalaryMutation();

  const handleDelete = async (id) => {
    const ok = window.confirm(
      'Delete this salary record? This action cannot be undone.'
    );
    if (!ok) return;

    // 1) Try the DELETE call only
    try {
      const res = await deleteSalary({ id }).unwrap();
    } catch (err) {
      console.error('Delete call failed:', err);
      alert('Failed to delete record.');
      return; // stop here; don't run refetch/setOpen on failure
    }

    // 2) Post-delete UI updates shouldn’t trigger the failure alert
    try {
      await (typeof refetch === 'function' ? refetch() : Promise.resolve());
    } catch (err) {
      console.warn(
        'Refetch failed (record is deleted, UI will sync via tags if configured):',
        err
      );
    }

    try {
      if (selected?._id === id) setOpen(false);
    } catch (err) {
      console.warn('Closing sheet failed:', err);
    }
  };

  return (
    <>
      <aside className="lg:col-span-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden lg:sticky lg:top-6">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">
                Latest payments and changes
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>

          {viewActiveLogPermission ? (
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-border">
              {isLoading && (
                <div className="p-6 text-sm text-muted-foreground">
                  Loading…
                </div>
              )}
              {isError && (
                <div className="p-6 text-sm text-destructive">
                  Failed to load activity.
                </div>
              )}

              {!isLoading && !isError && items.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground">
                  No recent activity.
                </div>
              )}

              {!isLoading &&
                !isError &&
                items.map((a) => (
                  <div
                    key={a._id}
                    className="p-4 flex gap-3 group hover:bg-muted/40 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      <ActionIcon action={a.paymentType} />
                    </div>

                    <div className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">
                          {a.staffName}
                        </span>

                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {a.cycleMonth}
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-foreground">
                        {a.paymentType === 'bonus' && (
                          <>
                            Bonus added: $
                            {fmtMoney(a.bonusAmount || a.amount || 0)}
                          </>
                        )}
                        {a.paymentType === 'decrement' && (
                          <>
                            Decrement applied: $
                            {fmtMoney(a.decrementAmount || a.amount || 0)}
                          </>
                        )}
                        {a.paymentType === 'salary' && (
                          <>
                            Salary paid: $
                            {fmtMoney(a.baseSalary || a.amount || 0)}
                          </>
                        )}
                        {typeof a.totalPaid === 'number' && (
                          <> — Total paid: ${fmtMoney(a.totalPaid)}</>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        <Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                        {fmtDateTime(a.processedAt)} 
                      </div>

                      <div className="mt-2 text-xs">
                        <Label className="text-muted-foreground mr-1">
                          Notes:
                        </Label>
                        <span className="text-foreground">
                          {a.notes?.trim() ? a.notes : 'No notes'}
                        </span>
                      </div>
                    </div>

                    {/* 3-dot menu */}
                    <div className="self-start">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 rounded-md hover:bg-muted text-muted-foreground"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            disabled={!deletePaymentPermission}
                            onClick={() => handleDelete(a._id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-4 text-sm flex gap-3 group hover:bg-muted/40 transition-colors">
              No data found
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
