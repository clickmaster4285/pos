'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DollarSign,
  Calendar,
  Briefcase,
  MoreVertical,
  TrendingUp,
  History,
} from 'lucide-react';

export function StaffCard({
  staff,
  onPaymentClick,
  onAdjustClick,
  openStaffSummary,
  createPaymentPermission,
  updateSalaryPermission,
  staffSummaryPermission,
  currencySymbol,
}) {
  const statusColors = {
    active: 'bg-accent/10 text-accent border-accent/20',
    pending: 'bg-destructive/10 text-destructive border-destructive/20',
    paid: 'bg-green-600/10 text-green-700 border-green-600/20',
  };

  const statusLabels = {
    active: 'Active',
    pending: 'Pending Payment',
    paid: 'Paid',
  };

  const lastPaymentText = staff.lastPaymentUnset
    ? 'Not exists'
    : new Date(staff.lastPayment).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <div
      className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow h-full flex flex-col"
      role="group"
      aria-label={`Staff card for ${staff.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            className="h-12 w-12 bg-secondary-foreground/10 text-primary shrink-0"
            onClick={() => {
              if (!staffSummaryPermission) return;
              openStaffSummary(staff.id);
            }}
          >
            <AvatarFallback className="text-sm font-semibold">
              {staff.avatar}
            </AvatarFallback>
          </Avatar>
          <div
            className="min-w-0"
            onClick={() => {
              if (!staffSummaryPermission) return;
              openStaffSummary(staff.id);
            }}
          >
            <h3
              className="font-semibold text-foreground text-lg truncate"
              title={staff.name}
            >
              {staff.name}
            </h3>
            <p
              className="text-sm text-muted-foreground truncate"
              title={staff.position || ''}
            >
              {staff.position}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open actions">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onAdjustClick(staff)}
              disabled={!updateSalaryPermission}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Increment Salary
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => openStaffSummary(staff.id)}
              staffSummaryPermission={staffSummaryPermission}
              disabled={!staffSummaryPermission}
            >
              <History className="h-4 w-4 mr-2" />
              View Salary History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Divider under header */}
      <div className="my-4 h-px " />

      {/* Body (flex-1 to push footer down) */}
      <div
        className="space-y-3 flex-1"
        onClick={() => {
          if (!staffSummaryPermission) return;
          openStaffSummary(staff.id);
        }}
      >
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-secondary-foreground shrink-0" />
          <span className="text-muted-foreground">Department:</span>
          <span
            className="font-medium text-foreground truncate"
            title={staff.department || ''}
          >
            {staff.department}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-secondary-foreground shrink-0" />
          <span className="text-muted-foreground">Monthly Salary:</span>
          <span className="font-semibold text-foreground">
            {currencySymbol}
            {Number(staff.salary).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-secondary-foreground shrink-0" />
          <span className="text-muted-foreground">Last Payment:</span>
          <span className="font-medium text-foreground">{lastPaymentText}</span>
        </div>
      </div>

      {/* Footer pinned to bottom */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <Badge variant="outline" className={statusColors[staff.status]}>
          {statusLabels[staff.status]}
        </Badge>
        <Button
          onClick={() => onPaymentClick(staff.id)}
          size="sm"
          variant="header"
          aria-label={`Make payment for ${staff.name}`}
          disabled={!createPaymentPermission}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Make Payment
        </Button>
      </div>
    </div>
  );
}
