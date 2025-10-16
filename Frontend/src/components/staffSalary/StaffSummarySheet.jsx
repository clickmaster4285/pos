'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Gift,
  TrendingDown,
  Clock,
  Mail,
  User as UserIcon,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useGetStaffSummaryQuery } from '@/features/staffSalaryApi';

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

const TypeBadge = ({ type }) => {
  if (type === 'bonus')
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Bonus
      </Badge>
    );
  if (type === 'decrement')
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        Deduction
      </Badge>
    );
  return (
    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
      Salary
    </Badge>
  );
};

const TypeIcon = ({ type }) => {
  if (type === 'bonus') return <Gift className="h-4 w-4 text-green-600" />;
  if (type === 'decrement')
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <DollarSign className="h-4 w-4 text-blue-600" />;
};

const PaymentCard = ({ payment, currencySymbol }) => {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const history = payment.history || [];
  const displayHistory = showAllHistory ? history : history.slice(0, 7);
  const hasMoreHistory = history.length > 7;

  return (
    <div className="rounded-lg border border-border bg-background/50 p-4 hover:bg-background/80 transition-colors">
      {/* Payment Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <TypeIcon type={payment.paymentType} />
          <div>
            <div className="font-semibold text-foreground">
              {payment.cycleMonth}
            </div>
            <div className="text-sm ">{payment.paymentMethod}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total Paid</div>
          <div className="text-lg font-bold text-foreground">
            {currencySymbol}
            {fmtMoney(payment.totalPaid)}
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="flex gap-10 text-sm mb-5">
        <div>
          <Label className="text-muted-foreground text-xs">Base Salary</Label>
          <div className="font-medium text-foreground">
            {currencySymbol} {fmtMoney(payment.baseSalary)}
          </div>
        </div>
        {payment.bonusAmount > 0 && (
          <div>
            <Label className="text-muted-foreground text-xs">Bonus</Label>
            <div className="font-medium text-green-600">
              + {currencySymbol}
              {fmtMoney(payment.bonusAmount)}
            </div>
          </div>
        )}
        {payment.decrementAmount > 0 && (
          <div>
            <Label className="text-muted-foreground text-xs">Deduction</Label>
            <div className="font-medium text-red-600">
              -${fmtMoney(payment.decrementAmount)}
            </div>
          </div>
        )}
      </div>

      {/* Meta Information */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {fmtDateTime(payment.processedAt)}
        </div>
      </div>

      {/* Notes */}
      {payment.notes && (
        <div className="mb-3 p-2 bg-muted/30 rounded-md">
          <Label className="text-muted-foreground text-xs block mb-1">
            Notes
          </Label>
          <div className="text-sm text-foreground">{payment.notes}</div>
        </div>
      )}
    </div>
  );
};

export default function StaffSummarySheet({
  open,
  onOpenChange,
  staffId,
  currencySymbol,
}) {
  const { data, isLoading, isError } = useGetStaffSummaryQuery(
    staffId ? { staffId, limit: 10 } : { staffId: '' },
    { skip: !open || !staffId }
  );

  const staff = data?.staff || data?.data?.staff;
  const payments = data?.recentPayments || data?.data?.recentPayments || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-4 w-full sm:max-w-2xl bg-card">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <UserIcon className="h-5 w-5" />
            Staff Payment Summary
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {staffId
              ? `Detailed payment history and information for staff member`
              : 'Select a staff member to view details'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading staff information...
              </div>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-destructive">
                Failed to load staff summary. Please try again.
              </div>
            </div>
          )}

          {!isLoading && !isError && staff && (
            <>
              {/* Staff Information Card */}
              <div className="rounded-lg border border-border bg-background/50 p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Staff Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Full Name
                      </Label>
                      <div className="font-medium text-foreground text-base">
                        {staff.name || '—'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Email
                      </Label>
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        {staff.email || '—'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Department
                      </Label>
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        {staff.department || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        User ID
                      </Label>
                      <div className="font-medium text-foreground">
                        {staff.userId || '—'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Base Salary (Monthly)
                      </Label>
                      <div className="font-bold text-foreground text-lg">
                        {currencySymbol}
                        {fmtMoney(staff.baseSalaryMonthly || 0)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Last Payment
                      </Label>
                      <div className="font-medium text-foreground">
                        {fmtDateTime(staff.lastPaymentDate) ||
                          'No payments yet'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Payments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-lg">
                    Recent Payments ({payments.length})
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    Last 10 payments
                  </Badge>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">
                      No payment history found
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {payments.map((payment) => (
                      <PaymentCard
                        key={payment._id}
                        payment={payment}
                        currencySymbol={currencySymbol}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
