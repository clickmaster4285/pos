'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Package, MapPin, AlertTriangle, Barcode } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeDialog = dynamic(
  () => import('../barcode/BarcodeDialog'),
  { ssr: false }
);

export function InventoryGrid({
  items = [],
  onEditInfo,
  onEditHistory,
  onDeleteItem,
}) {
  const [barcodeDialog, setBarcodeDialog] = useState({ open: false, sku: '', variantName: '', itemName: '' });

  const handleBarcodeGenerate = (pdfInfo) => {
    console.log('PDF generated:', pdfInfo);
  };

  if (!items.length)
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No inventory found.
      </div>
    );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <div className="font-medium">{it.itemName}</div>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  it.isActive
                    ? 'bg-emerald-600/10 text-emerald-700'
                    : 'bg-rose-600/10 text-rose-700'
                }`}
              >
                {it.status}
              </span>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {it.itemType}
            </div>
            <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {it.description || '—'}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Stat label="Variants" value={it.totalVariants} />
              <Stat label="On hand" value={it.quantity} />
              <Stat label="Incoming" value={it.incomingQuantity} />
              <Stat
                label="Inventory Value"
                value={Intl.NumberFormat().format(it.totalPrice)}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {it.variants.map((v) => {
                const low =
                  v.lowStockThreshold > 0 && v.quantity <= v.lowStockThreshold;
                return (
                  <div key={v.id} className="flex items-center gap-1">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] border ${
                        low ? 'border-amber-500/40 bg-amber-500/10' : 'bg-muted'
                      }`}
                    >
                      {v.variantName} · {v.quantity}
                      {low && (
                        <AlertTriangle className="ml-1 inline h-3 w-3 align-[-2px]" />
                      )}
                    </span>
                    {v.sku && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setBarcodeDialog({
                            open: true,
                            sku: v.sku,
                            variantName: v.variantName,
                            itemName: it.itemName,
                          })
                        }
                      >
                        <Barcode className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{it.location}</span>
            </div>
          </div>
        ))}
      </div>

      {barcodeDialog.open && (
        <BarcodeDialog
          open={true}
          onClose={() => setBarcodeDialog({ open: false, sku: '', variantName: '', itemName: '' })}
          sku={barcodeDialog.sku}
          variantName={barcodeDialog.variantName}
          itemName={barcodeDialog.itemName}
          onGenerate={handleBarcodeGenerate}
        />
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}