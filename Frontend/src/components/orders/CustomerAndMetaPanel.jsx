'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DynamicFieldInputs from './DynamicFieldInputs';

export default function CustomerAndMetaPanel({
  values,
  errors,
  update, // (patch) => void
  orderTypeOptions,
  orderScopedFields,
  isDineIn,
  tables,
  onTableSelect,
  forcedOrderType,
  lockOrderType,
}) {
  // Order-level fields, with dine-in specific ordering
  const filteredOrderFields = useMemo(() => {
    const base = (orderScopedFields || []).filter(
      (f) => f.name !== 'orderType'
    );
    const subset = isDineIn ? base : base.filter((f) => f.name !== 'tableNo');

    // Ensure the sequence: tableNo → waiterName → specialInstructions
    const priority = { tableNo: 1, waiterName: 2, specialInstructions: 3 };
    return subset.slice().sort((a, b) => {
      const pa = priority[a.name] ?? 99;
      const pb = priority[b.name] ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.label || a.name).localeCompare(b.label || b.name);
    });
  }, [orderScopedFields, isDineIn]);

  const typeOptions =
    Array.isArray(orderTypeOptions) && orderTypeOptions.length
      ? orderTypeOptions
      : ['Purchase', 'Service', 'Online', 'In-Store'];

  return (
    <>
      {/* Customer Details */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="grid gap-1.5">
          <Label className="text-xs">
            Customer Name<span className="text-red-600">(optional)</span>
          </Label>
          <Input
            value={values.customerName}
            onChange={(e) => update({ customerName: e.target.value })}
            placeholder="e.g., Zeeshan Ali"
            className={`h-9 ${errors.customerName ? 'border-destructive' : ''}`}
            aria-invalid={!!errors.customerName}
          />
          {errors.customerName ? (
            <p className="text-xs text-destructive mt-1">
              {errors.customerName}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">
            Customer PhoneNo<span className="text-red-600">(optional)</span>
          </Label>
          <Input
            value={values.customerPhone}
            onChange={(e) => update({ customerPhone: e.target.value })}
            inputMode="numeric"
            placeholder="e.g., 03451234567"
            className={`h-9 ${
              errors.customerPhone ? 'border-destructive' : ''
            }`}
            aria-invalid={!!errors.customerPhone}
          />
          {errors.customerPhone ? (
            <p className="text-xs text-destructive mt-1">
              {errors.customerPhone}
            </p>
          ) : null}
        </div>
      </div>

      {/* Order Type */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="grid gap-2 min-w-0">
          <Label className="text-xs">Order Type</Label>

          {/*
      Props expected from parent:
      - forcedOrderType: string ('In-Store' or 'Online')
      - lockOrderType: boolean
    */}
          {(() => {
            const effectiveValue =
              (lockOrderType ? forcedOrderType : values.orderType) || undefined;

            const handleChange = (v) => {
              if (lockOrderType) return; // ignore changes when locked
              update({ orderType: v });
            };

            // When locked, show disabled select with a single option for consistent UI
            const optionsToRender = lockOrderType
              ? [forcedOrderType]
              : typeOptions;

            return (
              <Select
                value={effectiveValue}
                onValueChange={handleChange}
                disabled={lockOrderType}
              >
                <SelectTrigger
                  className={`h-9 w-full min-w-0 ${
                    errors.orderType ? 'border-destructive' : ''
                  } [&>span]:block [&>span]:min-w-0 [&>span]:max-w-full [&>span]:truncate`}
                  aria-invalid={!!errors.orderType}
                  aria-readonly={lockOrderType || undefined}
                >
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>

                <SelectContent>
                  {optionsToRender.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}

          {errors.orderType ? (
            <p className="text-xs text-destructive mt-1">{errors.orderType}</p>
          ) : null}
        </div>
      </div>

      {/* Order-level Dynamic Attributes */}
      {filteredOrderFields.length > 0 && (
        <DynamicFieldInputs
          fields={filteredOrderFields}
          value={values.dynamicAttributes}
          onChange={(obj) => update({ dynamicAttributes: obj })}
          tables={tables}
          onTableSelect={onTableSelect}
        />
      )}
    </>
  );
}
