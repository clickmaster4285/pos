// ItemsSection.jsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Package, Calculator } from 'lucide-react';
import DynamicFieldInputs from './DynamicFieldInputs';
import { currency, toId } from './helpers';

function Truncate({ children, className, title }) {
  return (
    <span
      className={`block min-w-0 max-w-full truncate ${className || ''}`}
      title={
        typeof title === 'string'
          ? title
          : typeof children === 'string'
          ? children
          : undefined
      }
    >
      {children}
    </span>
  );
}

export default function ItemsSection({
  values,
  errors,
  invById,
  invOptions,
  productsLoading,
  itemScopedFields,
  updateItem,
  addItem,
  removeItem,
  onProductSelect, // (idx, productId) -> parent handles price/name/dynamicAttributes
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base">Items</Label>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addItem}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="grid gap-3">
        {values.items.map((it, idx) => {
          const selectedInvId = toId(it.productId);
          const inv = invById.get(selectedInvId) || null;
          const itemErr = errors.items[idx] || {};
          const lineTotal = Number(it.qty || 0) * Number(it.price || 0);

          return (
            <div
              key={idx}
              className="grid grid-cols-1 gap-3 rounded-lg border p-3 mt-2 sm:grid-cols-12 hover:bg-muted/30 transition-colors"
            >
              {/* Product select */}
              <div className="sm:col-span-5 grid gap-1.5 min-w-0">
                <Label className="text-xs ">Product</Label>
                <Select
                  key={`${invOptions.length}-${selectedInvId}`}
                  value={selectedInvId || undefined}
                  onValueChange={(id) => onProductSelect(idx, id)}
                  disabled={productsLoading || invOptions.length === 0}
                >
                  <SelectTrigger
                    className="
                      h-9 w-full min-w-0
                      [&>span]:block [&>span]:min-w-0 [&>span]:max-w-full [&>span]:truncate
                    "
                    title={it.name || undefined}
                  >
                    <SelectValue
                      placeholder={
                        productsLoading
                          ? 'Loading products...'
                          : invOptions.length
                          ? it.name || 'Select product'
                          : 'No products found'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {invOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <Truncate>
                          {opt.label} {opt.sub}
                        </Truncate>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inv ? (
                  <p className="text-[11px] text-muted-foreground">
                    SKU: {inv.SKU || '—'} • Stock: {inv.quantity ?? 0}
                  </p>
                ) : null}
              </div>

              {/* Name (editable) */}
              <div className="sm:col-span-3 grid gap-1.5 min-w-0">
                <Label className="text-xs ">Item Name</Label>
                <Input
                  value={it.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  className={`h-9 ${itemErr.name ? 'border-destructive' : ''}`}
                  aria-invalid={!!itemErr.name}
                  placeholder="e.g., Fries"
                />
                {itemErr.name ? (
                  <p className="text-xs text-destructive mt-1">
                    {itemErr.name}
                  </p>
                ) : null}
              </div>

              {/* Qty */}
              <div className="sm:col-span-2 grid gap-1.5 min-w-0">
                <Label className="text-xs ">Qty</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={it.qty}
                  onChange={(e) =>
                    updateItem(idx, { qty: Number(e.target.value) })
                  }
                  className={`h-9 ${
                    itemErr.qty || itemErr.stock ? 'border-destructive' : ''
                  }`}
                  aria-invalid={!!(itemErr.qty || itemErr.stock)}
                />
                {itemErr.qty ? (
                  <p className="text-xs text-destructive mt-1">{itemErr.qty}</p>
                ) : null}
                {!itemErr.qty && itemErr.stock ? (
                  <p className="text-xs text-destructive mt-1">
                    {itemErr.stock}
                  </p>
                ) : null}
              </div>

              {/* Price */}
              <div className="sm:col-span-2 grid gap-1.5 min-w-0">
                <Label className="text-xs ">Price</Label>
                <div className="relative">
                  <Calculator className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={it.price}
                    onChange={(e) =>
                      updateItem(idx, { price: Number(e.target.value) })
                    }
                    placeholder="0.00"
                    className="h-9 pl-8"
                  />
                </div>
                {itemErr.price ? (
                  <p className="text-xs text-destructive mt-1">
                    {itemErr.price}
                  </p>
                ) : null}
              </div>

              {/* Line total + remove */}
              <div className="sm:col-span-12 flex items-end justify-between gap-2 sm:justify-end">
                <div className="rounded-md px-2 py-1 text-sm font-medium flex gap-2">
                  <Label className="text-sm text-primary">Total: </Label>
                  <span> {currency(lineTotal)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(idx)}
                  disabled={values.items.length === 1}
                  className="text-destructive hover:text-destructive"
                  aria-label={`Remove item ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Per-item Dynamic Attributes (scoped) */}
              {itemScopedFields.length > 0 && (
                <div className="sm:col-span-12">
                  <DynamicFieldInputs
                    fields={itemScopedFields}
                    label="Item Attributes"
                    value={it.dynamicAttributes}
                    onChange={(obj) =>
                      updateItem(idx, { dynamicAttributes: obj })
                    }
                    compact
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
