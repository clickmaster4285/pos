'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  List,
  Package,
  AlertTriangle,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { useAddStockMutation } from '@/features/inventoryApi';

/* ========================= AddStockDialog ========================= */

import { AddStockDialog } from './AddStockDialog';

/* ========================= InventoryList with trigger ========================= */
export function InventoryList({
  items = [],
  onStockAdded,
  onEditInfo, // ← add
  onEditHistory, // ← add
  onDeleteItem,
}) {
  const [activeItem, setActiveItem] = useState(null);

  if (!items.length)
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No inventory found.
      </div>
    );

  return (
    <>
      <div className="divide-y rounded-lg border">
        {items.map((it) => (
          <div key={it.id} className="flex flex-col gap-2 p-3">
            <div className="flex justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Package className="h-4 w-4" />
                  <div className="font-medium">{it.itemName}</div>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                    {it.itemType}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] ${
                      it.isActive
                        ? 'bg-emerald-600/10 text-emerald-700'
                        : 'bg-rose-600/10 text-rose-700'
                    }`}
                  >
                    {it.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    • {it.companyId}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {it.description || '—'}
                </div>
              </div>
              <div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditInfo?.(it)}
                  >
                    Edit Info
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditHistory?.(it)}
                  >
                    Edit Inventory
                  </Button> */}

                  <Button onClick={() => setActiveItem(it)}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add stock
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteItem?.(it)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>

            {/* Variant rows */}
            <div className="mt-2 grid gap-2">
              {it.variants.map((v) => {
                const low =
                  v.lowStockThreshold > 0 && v.quantity <= v.lowStockThreshold;
                return (
                  <div
                    key={v.id}
                    className="grid grid-cols-2 gap-2 rounded border p-2 md:grid-cols-6"
                  >
                    <Cell label="Variant" value={v.variantName} />
                    <Cell label="SKU" value={v.sku || '—'} mono />
                    <Cell label="Qty" value={v.quantity} />
                    <Cell label="Incoming" value={v.incomingQuantity} />
                    <Cell
                      label="Price"
                      value={Intl.NumberFormat().format(v.price)}
                    />
                    <Cell
                      label="Cost"
                      value={Intl.NumberFormat().format(v.costPrice)}
                    />
                    {low && (
                      <div className="col-span-full mt-1 text-[11px] text-amber-700">
                        <AlertTriangle className="mr-1 inline h-3 w-3 align-[-2px]" />
                        Low stock (≤ {v.lowStockThreshold})
                      </div>
                    )}
                    {!!Object.keys(v.attributes || {}).length && (
                      <div className="col-span-full text-[11px] text-muted-foreground">
                        {Object.entries(v.attributes).map(([k, val]) => (
                          <span key={k} className="mr-2">
                            <span className="uppercase">{k}</span>:{' '}
                            {String(val)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-3 text-right sm:grid-cols-5">
              <Stat label="Variants" value={it.totalVariants} />
              <Stat label="On hand" value={it.quantity} />
              <Stat label="Incoming" value={it.incomingQuantity} />
              <Stat
                label="Inv. Value"
                value={Intl.NumberFormat().format(it.totalPrice)}
              />
              <Stat label="Location" value={it.location} />
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      {activeItem && (
        <AddStockDialog
          key={activeItem.id || activeItem._id} // ✅ safe key
          open={true}
          item={activeItem}
          onClose={(res) => {
            setActiveItem(null);
            if (res?.refreshed) onStockAdded?.();
          }}
        />
      )}
    </>
  );
}

/* ========================= Small UI helpers ========================= */

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function Cell({ label, value, mono }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}
