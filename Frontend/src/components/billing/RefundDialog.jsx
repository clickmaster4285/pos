'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RefundDialog({
  open,
  onOpenChange,
  bill, // { _id, billNumber }
  lines, // [{ sku, itemName, variantName, purchasedQty, alreadyRefunded, maxQty, quantity, reason }]
  setLines, // (updater) => void
  notes,
  setNotes,
  onSubmit, // () => void | Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partial Refund</DialogTitle>
          <DialogDescription>
            Select items and quantities to refund for bill{' '}
            <span className="font-medium">{bill?.billNumber}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-md divide-y">
            {lines.map((line, idx) => (
              <div
                key={`${line.sku}-${idx}`}
                className="p-3 flex items-center gap-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {line.itemName}{' '}
                    <span className="text-muted-foreground">
                      · {line.variantName}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SKU: {line.sku}
                  </div>

                  {/* Purchased / Refunded / Remaining */}
                  <div className="text-xs text-muted-foreground">
                    Purchased: {line.purchasedQty} · Refunded:{' '}
                    {line.alreadyRefunded} · Remaining: {line.maxQty}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={line.maxQty}
                    value={line.quantity}
                    disabled={line.maxQty === 0}
                    onChange={(e) => {
                      const raw = Number(e.target.value || 0);
                      const v = Math.max(0, Math.min(line.maxQty, raw));
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, quantity: v } : l
                        )
                      );
                    }}
                    className="w-24"
                    placeholder="Qty"
                  />
                  <Input
                    value={line.reason}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, reason: e.target.value } : l
                        )
                      )
                    }
                    className="w-56"
                    placeholder="Reason (optional)"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm mb-1">Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this partial refund"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Submit Partial Refund</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
