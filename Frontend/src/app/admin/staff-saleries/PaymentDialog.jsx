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

export function PaymentDialog({ open, onOpenChange, staff, onSubmit }) {
  const [paymentType, setPaymentType] = useState('salary'); // "salary" | "bonus" | "decrement"
  const [bonusAmount, setBonusAmount] = useState('');
  const [decrementAmount, setDecrementAmount] = useState('');

  if (!staff) return null;

  const base = useMemo(() => Number(staff.salary) || 0, [staff.salary]);
  const bonus = useMemo(
    () => Number.parseFloat(bonusAmount || '0') || 0,
    [bonusAmount]
  );
  const dec = useMemo(
    () => Number.parseFloat(decrementAmount || '0') || 0,
    [decrementAmount]
  );

  const total = useMemo(() => {
    if (paymentType === 'salary') return base;
    if (paymentType === 'bonus') return Math.max(0, base + bonus);
    if (paymentType === 'decrement') return Math.max(0, base - dec);
    return base;
  }, [paymentType, base, bonus, dec]);

  const getDescription = () => {
    switch (paymentType) {
      case 'salary':
        return 'Process regular monthly salary payment.';
      case 'bonus':
        return "Add a one-time bonus to this month's payment.";
      case 'decrement':
        return "Apply a one-time deduction to this month's payment.";
      default:
        return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      staffId: staff.id,
      type: paymentType,
      base,
      bonus: paymentType === 'bonus' ? bonus : 0,
      decrement: paymentType === 'decrement' ? dec : 0,
      total,
    });
    // reset
    setPaymentType('salary');
    setBonusAmount('');
    setDecrementAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Process Payment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage monthly payment for {staff.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Staff Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Employee:</span>
              <span className="text-sm font-semibold text-foreground">
                {staff.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Position:</span>
              <span className="text-sm font-medium text-foreground">
                {staff.position}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Current Monthly Salary:
              </span>
              <span className="text-sm font-semibold text-foreground">
                ${base.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold">
              Payment Type
            </Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
              <div className="flex items-center space-x-3 bg-background border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                <RadioGroupItem value="salary" id="salary" />
                <Label
                  htmlFor="salary"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">
                      Regular Salary
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pay this month's base salary
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 bg-background border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                <RadioGroupItem value="bonus" id="bonus" />
                <Label
                  htmlFor="bonus"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <Gift className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-foreground">Bonus</div>
                    <div className="text-xs text-muted-foreground">
                      One-time bonus on top of salary
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 bg-background border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                <RadioGroupItem value="decrement" id="decrement" />
                <Label
                  htmlFor="decrement"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <TrendingDown className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-foreground">
                      Decrement (Deduction)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      One-time deduction for this month
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">{getDescription()}</p>
          </div>

          {/* Amounts & Total */}
          <div className="space-y-4">
            <div>
              <Label className="text-foreground font-semibold">
                Base Monthly Salary ($)
              </Label>
              <Input
                value={base.toFixed(2)}
                readOnly
                className="bg-background mt-2"
              />
            </div>

            {paymentType === 'bonus' && (
              <div>
                <Label className="text-foreground font-semibold">
                  Bonus Amount ($)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  className="bg-background mt-2"
                />
              </div>
            )}

            {paymentType === 'decrement' && (
              <div>
                <Label className="text-foreground font-semibold">
                  Deduction Amount ($)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={decrementAmount}
                  onChange={(e) => setDecrementAmount(e.target.value)}
                  className="bg-background mt-2"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold text-foreground">
                Total to Pay
              </span>
              <span className="text-xl font-bold text-foreground">
                ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
