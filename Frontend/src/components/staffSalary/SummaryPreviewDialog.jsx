'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const fmt = (n) =>
  typeof n === 'number' && isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';

function calcSummary(items = []) {
  let totalQuantity = 0;
  let totalValue = 0;
  let totalCostValue = 0;
  let totalVariants = 0;

  for (const it of items) {
    for (const v of it.variants || []) {
      const q = Number(v.quantity || 0);
      const p = Number(v.price || 0);
      const c = Number(v.costPrice || 0);
      totalQuantity += q;
      totalValue += q * p;
      totalCostValue += q * c;
      totalVariants += 1;
    }
  }

  return {
    itemsCount: items.length,
    totalVariants,
    totalQuantity,
    totalValue,
    totalCostValue,
    totalProfit: totalValue - totalCostValue,
  };
}

export default function SummaryPreviewDialog({
  open,
  onClose, // (boolean) => void
  items = [],
  fromDate,
  toDate,
  onConfirm, // () => void (trigger actual PDF download)
}) {
  const summary = useMemo(() => calcSummary(items), [items]);

  // simple preview: first 20 lines
  const rows = useMemo(() => {
    return items.slice(0, 20).map((it) => {
      const qty = (it.variants || []).reduce(
        (s, v) => s + (v.quantity || 0),
        0
      );
      const val = (it.variants || []).reduce(
        (s, v) => s + Number(v.quantity || 0) * Number(v.price || 0),
        0
      );
      return {
        id: it.id || it._id,
        name: it.itemName || '—',
        variants: (it.variants || []).length,
        qty,
        val,
      };
    });
  }, [items]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Inventory Summary Preview
          </DialogTitle>
          <div className="text-xs text-muted-foreground">
            Period: {fromDate || '—'} to {toDate || '—'}
          </div>
        </DialogHeader>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Items</div>
            <div className="text-base font-semibold">{summary.itemsCount}</div>
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Variants</div>
            <div className="text-base font-semibold">
              {summary.totalVariants}
            </div>
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Total Quantity</div>
            <div className="text-base font-semibold">
              {fmt(summary.totalQuantity)}
            </div>
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">
              Total Value (Selling)
            </div>
            <div className="text-base font-semibold">
              ${fmt(summary.totalValue)}
            </div>
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">
              Total Cost Value
            </div>
            <div className="text-base font-semibold">
              ${fmt(summary.totalCostValue)}
            </div>
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Profit (Est.)</div>
            <div className="text-base font-semibold">
              ${fmt(summary.totalProfit)}
            </div>
          </div>
        </div>

        {/* Table preview */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-2 text-foreground">
            Preview (first 20 items)
          </div>
          <div className="max-h-[280px] overflow-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-2">Item</th>
                  <th className="p-2">Variants</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.variants}</td>
                    <td className="p-2">{fmt(r.qty)}</td>
                    <td className="p-2">${fmt(r.val)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={4}>
                      No data in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {items.length > 20 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Showing first 20 of {items.length} items.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onClose(false)}>
            Back
          </Button>
          <Button onClick={onConfirm}>Download PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
