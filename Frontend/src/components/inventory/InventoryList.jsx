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
} from 'lucide-react';
import { useAddStockMutation } from '@/features/inventoryApi';

/* ========================= AddStockDialog ========================= */

function AddStockDialog({ open, onClose, item }) {
  const EMPTY_ROW = {
    variantName: '',
    incomingQuantity: '',
    price: '',
    costPrice: '',
    returnUnder: 7,
    attributes: { size: '', material: '' },
  };

  const [rows, setRows] = useState([EMPTY_ROW]);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [addStock, { isLoading }] = useAddStockMutation();

  // put this near the top of AddStockDialog

  useEffect(() => {
    if (!open || !item) return;

    // hard reset all form fields on every open
    setReason('');
    setComments('');
    setErrorMsg('');

    setRows([
      {
        ...EMPTY_ROW,
        // optionally seed the name from first existing variant
        variantName: item?.variants?.[0]?.variantName || '',
      },
    ]);
    // reset when opening and when switching to a different item
  }, [open, item?.id]);
  if (!open || !item) return null;

  const addRow = () => setRows((r) => [...r, { ...EMPTY_ROW }]);

  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  const setRow = (idx, patch) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const setAttr = (idx, key, val) =>
    setRows((r) =>
      r.map((row, i) =>
        i === idx
          ? { ...row, attributes: { ...row.attributes, [key]: val } }
          : row
      )
    );

  const validate = () => {
    if (!rows.length) return 'Add at least one variant';
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i];
      if (!v.variantName.trim())
        return `Row ${i + 1}: variant name is required`;
      const iq = Number(v.incomingQuantity);
      if (!Number.isFinite(iq) || iq <= 0)
        return `Row ${i + 1}: incoming quantity must be > 0`;
      const price = Number(v.price);
      if (!Number.isFinite(price) || price < 0)
        return `Row ${i + 1}: price must be ≥ 0`;
      const cost = Number(v.costPrice);
      if (!Number.isFinite(cost) || cost < 0)
        return `Row ${i + 1}: costPrice must be ≥ 0`;
      const ru = Number(v.returnUnder);
      if (!Number.isFinite(ru) || ru < 0)
        return `Row ${i + 1}: returnUnder must be ≥ 0`;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setErrorMsg(err);

    const payload = {
      id: item.id, // for RTK hook convenience
      variants: rows.map((v) => ({
        variantName: v.variantName.trim(),
        incomingQuantity: Number(v.incomingQuantity),
        price: Number(v.price),
        costPrice: Number(v.costPrice),
        returnUnder: Number(v.returnUnder),
        attributes: Object.fromEntries(
          Object.entries(v.attributes || {}).filter(([, val]) =>
            String(val || '').trim()
          )
        ),
      })),
      reason: reason.trim() || 'Stock receiving',
      comments: comments.trim(),
    };

    try {
      setErrorMsg('');
      await addStock(payload).unwrap();
      onClose?.({ refreshed: true });
    } catch (errRes) {
      setErrorMsg(
        errRes?.data?.message || errRes?.error || 'Failed to add stock'
      );
    }
  };

  const existingVariantNames = (item.variants || []).map((v) => v.variantName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
      />
      {/* modal */}
      <div className="relative z-10 w-full max-w-3xl rounded-xl border bg-background p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Stock — {item.itemName}</h2>
          <Button variant="outline" size="sm" onClick={() => onClose?.()}>
            <X className="mr-1 h-4 w-4" />
            Close
          </Button>
        </div>

        {errorMsg ? (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* rows */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Variants</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
              >
                <Plus className="mr-1 h-3 w-3" /> Add row
              </Button>
            </div>

            <div className="space-y-3">
              {rows.map((v, idx) => (
                <div key={idx} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium">Row #{idx + 1}</div>
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeRow(idx)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Variant name
                      </label>
                      <input
                        list={`variant-suggestions-${item.id}`}
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.variantName}
                        onChange={(e) =>
                          setRow(idx, { variantName: e.target.value })
                        }
                        placeholder="Front Brake Pad - Medium"
                      />
                      <datalist id={`variant-suggestions-${item.id}`}>
                        {existingVariantNames.map((n) => (
                          <option key={n} value={n} />
                        ))}
                      </datalist>
                    </div>

                    <NumField
                      label="Incoming qty"
                      value={v.incomingQuantity}
                      onChange={(val) => setRow(idx, { incomingQuantity: val })}
                      placeholder="20"
                      min={0}
                    />
                    <NumField
                      label="Price"
                      value={v.price}
                      onChange={(val) => setRow(idx, { price: val })}
                      placeholder="2500"
                      min={0}
                    />
                    <NumField
                      label="Cost price"
                      value={v.costPrice}
                      onChange={(val) => setRow(idx, { costPrice: val })}
                      placeholder="2000"
                      min={0}
                    />
                    <NumField
                      label="Return under (days)"
                      value={v.returnUnder}
                      onChange={(val) => setRow(idx, { returnUnder: val })}
                      placeholder="7"
                      min={0}
                    />

                    <TextField
                      label="Attribute: Size"
                      value={v.attributes?.size || ''}
                      onChange={(val) => setAttr(idx, 'size', val)}
                      placeholder="Medium"
                    />
                    <TextField
                      label="Attribute: Material"
                      value={v.attributes?.material || ''}
                      onChange={(val) => setAttr(idx, 'material', val)}
                      placeholder="Ceramic"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* reason/comments */}
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label="Reason"
              value={reason}
              onChange={setReason}
              placeholder="Supplier delivery"
            />
            <TextField
              label="Comments"
              value={comments}
              onChange={setComments}
              placeholder="PO-2025-09-26"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onClose?.()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding…' : 'Add stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================= InventoryList with trigger ========================= */

export function InventoryList({ items = [], onStockAdded }) {
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
                <Button onClick={() => setActiveItem(it)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add stock
                </Button>
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

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">
        {label}
      </label>
      <input
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function NumField({ label, value, onChange, placeholder, min = 0 }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
