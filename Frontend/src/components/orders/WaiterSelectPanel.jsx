'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WaiterSelectPanel({
  industry,
  user,
  isWaiter,
  isAdmin,
  values,
  errors,
  setValues,
  isDineIn,
}) {
  // Only show for restaurant + dine-in
  if (String(industry).toLowerCase() !== 'restaurant' || !isDineIn) return null;

  // Prefer waiterName from dynamic attributes
  const waiterName =
    values?.dynamicAttributes?.waiterName ||
    (isWaiter ? user?.fullName || user?.name || '' : '') ||
    '';

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      <div className="grid gap-2 min-w-0">
        <Label className="text-xs">Waiter</Label>
        <Input
          value={waiterName}
          readOnly
          className="h-9"
          placeholder="Select a table to auto-fill"
        />
        {errors.waiterId ? (
          <p className="text-xs text-destructive mt-1">{errors.waiterId}</p>
        ) : null}
      </div>
    </div>
  );
}
