'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WarehouseGrid({ items, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => {
        const total = item.quantity * item.unitPrice;
        const low = item.quantity > 0 && item.quantity < 50;
        const out = item.quantity === 0;

        return (
          <Card
            key={item.id}
            className="bg-card border-border p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {item.partNumber}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.partName}
                  </h3>
                </div>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    out
                      ? 'bg-destructive/15 text-destructive'
                      : low
                      ? 'bg-yellow-500/15 text-yellow-600'
                      : 'bg-emerald-500/15 text-emerald-600',
                  ].join(' ')}
                  title="Stock status"
                >
                  {out ? 'Out' : low ? 'Low' : 'In Stock'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Category</div>
                <div className="text-foreground text-right">
                  {item.category}
                </div>

                <div className="text-muted-foreground">Location</div>
                <div className="text-foreground text-right">
                  {item.location}
                </div>

                <div className="text-muted-foreground">Supplier</div>
                <div className="text-foreground text-right">
                  {item.supplier || '—'}
                </div>

                <div className="text-muted-foreground">Quantity</div>
                <div className="text-foreground text-right">
                  {item.quantity}
                </div>

                <div className="text-muted-foreground">Unit Price</div>
                <div className="text-foreground text-right">
                  ${item.unitPrice.toFixed(2)}
                </div>

                <div className="text-muted-foreground">Total Value</div>
                <div className="text-primary font-semibold text-right">
                  ${total.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="border-border"
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        );
      })}

      {items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          No parts found. Try adjusting your filters.
        </Card>
      )}
    </div>
  );
}
