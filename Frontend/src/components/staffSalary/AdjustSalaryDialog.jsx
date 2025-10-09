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

export function AdjustSalaryDialog({ open, onOpenChange, staff, onApply }) {
  const [inc, setInc] = useState('');
  if (!staff) return null;

  const handleApply = (e) => {
    e.preventDefault();
    const add = Number.parseFloat(inc || '0') || 0;
    if (add <= 0) return;
    onApply(staff.id, add);
    setInc('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Adjust Monthly Salary
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add an increment to {staff.name}&apos;s monthly salary.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleApply} className="space-y-5">
          <div className="bg-muted/40 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Current Monthly Salary:
              </span>
              <span className="font-semibold text-foreground">
                $
                {Number(staff.salary).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">
              Increment Amount ($)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 250.00"
              value={inc}
              onChange={(e) => setInc(e.target.value)}
              className="bg-background"
              required
            />
            <p className="text-xs text-muted-foreground">
              This permanently increases the <b>monthly</b> salary.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Apply Increment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}