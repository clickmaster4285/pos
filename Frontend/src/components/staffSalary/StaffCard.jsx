'use client';

import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreatePaymentMutation } from '@/features/staffSalaryApi';
import {
  DollarSign,
  Users,
  TrendingUp,
  Wallet,
  Calendar,
  Briefcase,
  MoreVertical,
  Gift,
  TrendingDown,
} from 'lucide-react';

export function StaffCard({ staff, onPaymentClick, onAdjustClick }) {
  const statusColors = {
    active: 'bg-accent/10 text-accent border-accent/20',
    pending: 'bg-destructive/10 text-destructive border-destructive/20',
    paid: 'bg-success/10 text-success border-success/20',
  };

  const statusLabels = {
    active: 'Active',
    pending: 'Pending Payment',
    paid: 'Paid',
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-secondary-foreground/10 text-primary">
            <AvatarFallback className="text-sm font-semibold">
              {staff.avatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {staff.name}
            </h3>
            <p className="text-sm text-muted-foreground">{staff.position}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onAdjustClick(staff)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Increment Salary
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Department:</span>
          <span className="font-medium text-foreground">
            {staff.department}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Monthly Salary:</span>
          <span className="font-semibold text-foreground">
            $
            {Number(staff.salary).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Last Payment:</span>
          <span className="font-medium text-foreground">
            {staff.lastPaymentUnset
              ? 'Not exists'
              : new Date(staff.lastPayment).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Badge variant="outline" className={statusColors[staff.status]}>
          {statusLabels[staff.status]}
        </Badge>
        <Button
          onClick={() => onPaymentClick(staff)}
          size="sm"
          variant={'secondary'}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Make Payment
        </Button>
      </div>
    </div>
  );
}
