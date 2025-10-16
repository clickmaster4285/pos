"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List,
  Package,
  AlertTriangle,
  Plus,
  X,
  Trash2,
  Barcode,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useAddStockMutation } from "@/features/inventoryApi";
import { AddStockDialog } from "./AddStockDialog";
import dynamic from "next/dynamic";

const BarcodeDialog = dynamic(() => import("../barcode/BarcodeDialog"), {
  ssr: false,
});

const InventoryDetailDialog = dynamic(() => import("./InventoryDetailDialog"), {
  ssr: false,
});

export function InventoryList({
  items = [],
  onStockAdded,
  onEditInfo,
  onEditHistory,
  onDeleteItem,
  currencySymbol,
}) {
  const [activeItem, setActiveItem] = useState(null);
  const [barcodeDialog, setBarcodeDialog] = useState({
    open: false,
    sku: '',
    variantName: '',
    itemName: '',
  });
  const [detailDialog, setDetailDialog] = useState({ open: false, item: null });
  const [expandedItems, setExpandedItems] = useState({});

  const handleBarcodeGenerate = (pdfInfo) => {
    console.log('PDF generated:', pdfInfo);
  };

  const toggleVariants = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  if (!items.length)
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No inventory found.
      </div>
    );

  return (
    <>
      <div className="grid gap-6">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-lg border bg-card shadow-sm p-6 hover:shadow-md transition-shadow "
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{it.itemName}</h2>
                  <span className="rounded bg-muted px-2 py-1 text-xs font-medium">
                    {it.itemType}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      it.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {it.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {it.companyId}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {it.description || '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDetailDialog({ open: true, item: it })}
                >
                  <Info className="mr-1 h-4 w-4" />
                  View Details
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditInfo?.(it)}
                >
                  Edit Info
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditHistory?.(it)}
                >
                  Edit Inventory
                </Button>
                <Button size="sm" onClick={() => setActiveItem(it)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Stock
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteItem?.(it)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="header"
                  size="sm"
                  onClick={() => toggleVariants(it.id)}
                >
                  {expandedItems[it.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {expandedItems[it.id] && (
              <div className="grid gap-4">
                {it.variants.map((v) => {
                  const low =
                    v.lowStockThreshold > 0 &&
                    v.quantity <= v.lowStockThreshold;
                  return (
                    <div
                      key={v.id}
                      className="rounded-md border p-4 bg-background"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                      </div>
                      {low && (
                        <div className="mt-2 text-xs text-amber-700 flex items-center">
                          <AlertTriangle className="mr-1 h-4 w-4" />
                          Low stock (≤ {v.lowStockThreshold})
                        </div>
                      )}
                      {!!Object.keys(v.attributes || {}).length && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {Object.entries(v.attributes).map(([k, val]) => (
                            <span key={k} className="mr-3">
                              <span className="font-medium uppercase">{k}</span>
                              : {String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                      {v.sku && (
                        <div className="mt-2">
                          <Button
                            variant="secondary"
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
                            <Barcode className="mr-1 h-4 w-4" />
                            Generate Barcode
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-6 gap-4 text-left">
              <Stat
                label="Last update"
                value={new Date(it.updatedAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
              <Stat label="Variants" value={it.variants.length} />
              <Stat label="Total Quantity" value={it.totalQuantity} />
              <Stat
                label="Total Cost Price"
                value={it.totalCostPrice}
                currencySymbol={currencySymbol}
              />
              <Stat
                label="totalPrice"
                value={Intl.NumberFormat().format(it.totalPrice)}
                currencySymbol={currencySymbol}
              />
              <Stat label="Location" value={it.location} />
            </div>
          </div>
        ))}
      </div>

      {activeItem && (
        <AddStockDialog
          key={activeItem.id || activeItem._id}
          open={true}
          item={activeItem}
          onClose={(res) => {
            setActiveItem(null);
            if (res?.refreshed) onStockAdded?.();
          }}
        />
      )}

      {barcodeDialog.open && (
        <BarcodeDialog
          open={true}
          onClose={() =>
            setBarcodeDialog({
              open: false,
              sku: '',
              variantName: '',
              itemName: '',
            })
          }
          sku={barcodeDialog.sku}
          variantName={barcodeDialog.variantName}
          itemName={barcodeDialog.itemName}
          onGenerate={handleBarcodeGenerate}
        />
      )}

      {detailDialog.open && (
        <InventoryDetailDialog
          open={true}
          item={detailDialog.item}
          onClose={() => setDetailDialog({ open: false, item: null })}
          currencySymbol={currencySymbol}
        />
      )}
    </>
  );
}

function Stat({ label, value, currencySymbol }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">
        {currencySymbol}
        {value}
      </div>
    </div>
  );
}

function Cell({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
