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

export function AddStockDialog({ open, onClose, item }) {
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
  // put this near the top of AddStockDialog, after `const existingVariantNames = ...`
  const existingByName = React.useMemo(() => {
    const map = {};
    (item.variants || []).forEach((v) => {
      const key = String(v.variantName || '')
        .trim()
        .toLowerCase();
      if (key) map[key] = v; // keep the whole variant (sku, price, etc.)
    });
    return map;
  }, [item.variants]);

  useEffect(() => {
    if (!open || !item) return;
    setReason('');
    setComments('');
    setErrorMsg('');
    setRows([{ ...EMPTY_ROW }]); // ← no seeding
  }, [open, item?.id || item?._id]);

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

    // in handleSubmit, when you build the payload:
    const payload = {
      id: item.id || item._id, // safe
      variants: rows.map((v) => {
        const key = String(v.variantName || '')
          .trim()
          .toLowerCase();
        const match = key ? existingByName[key] : undefined;

        const base = {
          variantName: (v.variantName || '').trim(),
          incomingQuantity: Number(v.incomingQuantity),
          price: Number(v.price),
          costPrice: Number(v.costPrice),
          returnUnder: Number(v.returnUnder),
          attributes: Object.fromEntries(
            Object.entries(v.attributes || {}).filter(([, val]) =>
              String(val || '').trim()
            )
          ),
        };

        // If matches existing variant name, reuse its SKU.
        if (match && match.sku) {
          base.sku = match.sku;
        }
        // IMPORTANT: do NOT set base.sku = null for new variants.

        return base;
      }),
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
  // inside AddStockDialog, before return()
  const safeId = item?.id || item?._id || 'new';
  const listId = `variant-suggestions-${safeId}`;

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
                        list={listId}
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.variantName}
                        // when changing variant name
                        onChange={(e) => {
                          const name = e.target.value;
                          const key = String(name).trim().toLowerCase();
                          const m = existingByName[key];

                          setRows((prev) =>
                            prev.map((row, i) => {
                              if (i !== idx) return row;

                              // Start with the new name
                              const next = { ...row, variantName: name };

                              if (m) {
                                // Only auto-fill if the current field is empty
                                if (!next.price) next.price = m.price || '';
                                if (!next.costPrice)
                                  next.costPrice = m.costPrice || '';
                                if (!next.returnUnder)
                                  next.returnUnder = m.returnUnder || 7;
                                // If you want to copy attributes only when empty:
                                if (
                                  !next.attributes ||
                                  !Object.keys(next.attributes).length
                                ) {
                                  next.attributes = { ...(m.attributes || {}) };
                                }
                              }
                              return next;
                            })
                          );
                        }}
                        placeholder="Front Brake Pad - Medium"
                        autoComplete="off"
                        name={`variant-name-${idx}-${safeId}`}
                      />

                      <datalist id={listId}>
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
