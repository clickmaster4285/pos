'use client';

import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DollarSign, Gift, TrendingDown, Calendar } from 'lucide-react';

// ⬇️ import shadcn Select
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

function yyyymm(d = new Date()) {
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 7);
  return iso;
}

export function PaymentDialog({ open, onOpenChange, staff, onSubmit }) {
  const [paymentType, setPaymentType] = useState(null); // null | "bonus" | "decrement"
  const [bonusAmount, setBonusAmount] = useState('');
  const [decrementAmount, setDecrementAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [cycleMonth, setCycleMonth] = useState(yyyymm());

  // ⬇️ default to "cash"
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customMethod, setCustomMethod] = useState('');

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
    if (paymentType === 'bonus') return Math.max(0, base + bonus);
    if (paymentType === 'decrement') return Math.max(0, base - dec);
    return base;
  }, [paymentType, base, bonus, dec]);

  const getDescription = () => {
    if (!paymentType)
      return 'Process base salary payment only, or select bonus/deduction to modify the amount.';
    switch (paymentType) {
      case 'bonus':
        return 'Add a one-time bonus for the selected month (optional).';
      case 'decrement':
        return 'Apply a one-time deduction for the selected month (optional).';
      default:
        return '';
    }
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType((current) => (current === type ? null : type));
    if (paymentType === type) {
      if (type === 'bonus') setBonusAmount('');
      if (type === 'decrement') setDecrementAmount('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const bonus = Number.parseFloat(bonusAmount || '0') || 0;
    const dec = Number.parseFloat(decrementAmount || '0') || 0;

    if (bonus > 0 && dec > 0) return;

    // ⬇️ resolve final method (require a value if custom)
    const finalMethod =
      paymentMethod === 'custom' ? (customMethod || '').trim() : paymentMethod;

    if (paymentMethod === 'custom' && !finalMethod) {
      // you can swap this with your toast
      alert('Please enter a custom payment method.');
      return;
    }

    const payload = {
      staffId: staff.id || staff._id,
      paymentType: 'salary',
      bonusAmount: paymentType === 'bonus' ? bonus : 0,
      decrementAmount: paymentType === 'decrement' ? dec : 0,
      notes: (notes || '').trim(),
      cycleMonth,
      paymentMethod: finalMethod, // ⬅️ send resolved method
    };

    onSubmit(payload);

    // reset
    setPaymentType(null);
    setBonusAmount('');
    setDecrementAmount('');
    setNotes('');
    setCycleMonth(yyyymm());
    setPaymentMethod('cash');
    setCustomMethod('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Make the dialog a column and cap its height */}
      <DialogContent className="bg-background max-h-[85vh] p-0 flex flex-col">
        {/* Header stays as-is, sticky at the top */}
        <DialogHeader className="sticky top-0 z-10 px-6 pt-6">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Process Payment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Process salary payment for {staff.name}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body (the key change) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Staff Info */}
            <div className="bg-card rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Employee:</span>
                <span className="text-sm font-semibold text-foreground">
                  {staff.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Position:</span>
                <span className="text-sm font-medium text-foreground">
                  {staff.position || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Monthly Salary:
                </span>
                <span className="text-sm font-semibold text-foreground">
                  $
                  {base.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Month picker */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cycle Month
              </Label>
              <Input
                type="month"
                value={cycleMonth}
                onChange={(e) => setCycleMonth(e.target.value)}
                className=""
              />
              <p className="text-xs text-muted-foreground">
                Default is the current month. You can pick any month and year.
              </p>
            </div>

            {/* Adjustments */}
            <div className="space-y-3">
              <Label className="text-foreground font-semibold">
                Additional Adjustments (Optional)
              </Label>

              {/* Bonus */}
              <div
                className={`flex items-center space-x-3 bg-card border rounded-lg p-4 transition-colors cursor-pointer ${
                  paymentType === 'bonus'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handlePaymentTypeChange('bonus')}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'bonus'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {paymentType === 'bonus' && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <Label className="flex-1 cursor-pointer flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-foreground">Add Bonus</div>
                    <div className="text-xs text-muted-foreground">
                      Optional one-time bonus on top of base salary
                    </div>
                  </div>
                </Label>
              </div>

              {/* Deduction */}
              <div
                className={`flex items-center space-x-3 bg-card border rounded-lg p-4 transition-colors cursor-pointer ${
                  paymentType === 'decrement'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handlePaymentTypeChange('decrement')}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'decrement'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {paymentType === 'decrement' && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <Label className="flex-1 cursor-pointer flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-foreground">
                      Add Deduction
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Optional one-time deduction from base salary
                    </div>
                  </div>
                </Label>
              </div>

              <p className="text-sm text-muted-foreground">
                {getDescription()}
              </p>
            </div>

            {/* Payment Method (dropdown + optional custom field) */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                Payment Method
              </Label>

              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  setPaymentMethod(v);
                  if (v !== 'custom') setCustomMethod('');
                }}
              >
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="easypaisa">Easypaisa</SelectItem>
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>

              {paymentMethod === 'custom' && (
                <Input
                  type="text"
                  placeholder="Enter custom method (e.g., Bank Transfer, JazzCash)"
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  className="bg-card"
                />
              )}
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
                  className="bg-card mt-2"
                />
              </div>

              {paymentType === 'bonus' && (
                <div>
                  <Label className="text-foreground font-semibold">
                    Bonus Amount ($) - Optional
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="bg-card mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave as 0 if you only want to process base salary
                  </p>
                </div>
              )}

              {paymentType === 'decrement' && (
                <div>
                  <Label className="text-foreground font-semibold">
                    Deduction Amount ($) - Optional
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={decrementAmount}
                    onChange={(e) => setDecrementAmount(e.target.value)}
                    className="bg-card mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave as 0 if you only want to process base salary
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label className="text-foreground font-semibold">
                  Notes (optional)
                </Label>
                <Input
                  type="text"
                  placeholder="Add a note…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-card mt-2"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold text-foreground">
                  Total to Pay
                </span>
                <span className="text-xl font-bold text-foreground">
                  $
                  {total.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  setPaymentType(null);
                  setBonusAmount('');
                  setDecrementAmount('');
                  setNotes('');
                  setCycleMonth(yyyymm());
                  setPaymentMethod('cash'); // reset to default
                  setCustomMethod('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
