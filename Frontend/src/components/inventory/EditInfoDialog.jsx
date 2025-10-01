'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useUpdateInventoryItemMutation ,useUpdateInventoryInfoMutation} from '@/features/inventoryApi';

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v || ''));

export  function EditHistoryDialog({
  open,
  item,
  onClose,
  defaultHistoryId = '',
}) {
  const [updateHistory, { isLoading }] = useUpdateInventoryItemMutation();

  const variants = useMemo(
    () =>
      Array.isArray(item?.variants)
        ? item.variants.map((v) => ({
            id: String(v.id || v._id),
            variantName: v.variantName || '—',
            sku: v.sku || '',
          }))
        : [],
    [item]
  );

  const [historyId, setHistoryId] = useState(defaultHistoryId);
  const [variantId, setVariantId] = useState('');
  const [incomingQuantity, setIncomingQuantity] = useState('0');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sku, setSku] = useState('');
  const [reason, setReason] = useState('Audit stock correction');
  const [comments, setComments] = useState('Adjusted via history edit');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    setHistoryId(defaultHistoryId || '');
    setVariantId(variants[0]?.id || '');
    setIncomingQuantity('0');
    setPrice('');
    setCostPrice('');
    setSku(variants[0]?.sku || '');
    setReason('Audit stock correction');
    setComments('Adjusted via history edit');
  }, [open, defaultHistoryId, variants]);

  if (!open || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isObjectId(historyId)) {
      return setErrorMsg(
        'historyId must be a 24-character ObjectId (History collection _id).'
      );
    }
    if (!variantId) {
      return setErrorMsg('Please choose a variant to edit.');
    }
    const q = Number(incomingQuantity);
    if (!Number.isFinite(q) || q < 0) {
      return setErrorMsg('incomingQuantity must be a non-negative number.');
    }

    try {
      const body = {
        variants: [
          {
            variantId,
            incomingQuantity: q,
          },
        ],
        reason,
        source: 'MANUAL',
        comments,
      };

      if (price !== '') body.variants[0].price = Number(price);
      if (costPrice !== '') body.variants[0].costPrice = Number(costPrice);
      if (sku) body.variants[0].sku = sku;

      await updateHistory({
        id: item.id || item._id,
        historyId,
        ...body,
      }).unwrap();

      onClose?.({ refreshed: true });
    } catch (err) {
      setErrorMsg(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          'Failed to update via history'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
      />
      <div
        className="relative z-10 w-full max-w-xl rounded-xl border bg-background p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Edit via History — {item.itemName}
          </h2>
          <Button
            variant="outline"
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            <X size={18} />
          </Button>
        </div>

        {errorMsg ? (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                History ID (History collection _id)
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={historyId}
                onChange={(e) => setHistoryId(e.target.value)}
                placeholder="6700f123abcd4567ef890123"
              />
              {historyId && !isObjectId(historyId) && (
                <p className="mt-1 text-xs text-destructive">
                  Must be a 24-character ObjectId.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Variant
              </label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={variantId}
                onChange={(e) => {
                  const vId = e.target.value;
                  setVariantId(vId);
                  const v = variants.find((x) => x.id === vId);
                  setSku(v?.sku || '');
                }}
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variantName} {v.sku ? `(${v.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                New incomingQuantity
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                type="number"
                min={0}
                value={incomingQuantity}
                onChange={(e) => setIncomingQuantity(e.target.value)}
                placeholder="e.g. 340"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Price (optional)
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 333"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Cost Price (optional)
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                type="number"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="e.g. 33"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                SKU (optional)
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PAR-XFS1-366076-001"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                Reason
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                Comments
              </label>
              <textarea
                className="min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Notes about this history correction"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose?.()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save history update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const allowedTypes = new Set(['Part', 'Whole', 'Other']);

export  function EditInfoDialog({ open, item, vendors = [], onClose }) {
  const [updateInfo, { isLoading }] = useUpdateInventoryInfoMutation();

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Part');
  const [vendorId, setVendorId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Normalize vendors for dropdown
  const vendorOptions = useMemo(
    () =>
      (Array.isArray(vendors) ? vendors : []).map((v) => ({
        id: String(v._id || v.id || v.vendorId || ''),
        name: v.name || 'Unnamed vendor',
      })),
    [vendors]
  );

  // Hydrate form when opening or when item changes
  useEffect(() => {
    if (!open || !item) return;
    setErrorMsg('');
    setItemName(item.itemName || '');
    const t = String(item.itemType || 'Part').toLowerCase();
    setItemType(allowedTypes.has(t) ? t : 'Part');
    setVendorId(String(item.vendor?._id || item.vendor?.id || item.vendor || ''));
    setLocation(item.location || '');
    setDescription(item.description || '');
  }, [open, item]);

  if (!open || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic guards mirroring backend validator
    if (!itemName.trim()) return setErrorMsg('Item name is required');
    if (!allowedTypes.has(itemType)) return setErrorMsg('itemType must be Part, Whole, or Other');
    if (vendorId && !isObjectId(vendorId)) return setErrorMsg('Vendor must be a valid ObjectId');

    try {
      const payload = {
        itemName: itemName.trim(),
        itemType,
        location: location.trim(),
        description: description.trim(),
        reason: 'Info update',
        source: 'MANUAL',
        comments: 'Edited from EditInfoDialog',
      };
      if (vendorId) payload.vendor = vendorId; // only send if present & valid

      await updateInfo({
        id: item.id || item._id,
        ...payload,
      }).unwrap();

      onClose?.({ refreshed: true }); // tell parent to refetch
    } catch (err) {
      setErrorMsg(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          'Failed to update item'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
      />
      <div
        className="relative z-10 w-full max-w-xl rounded-xl border bg-background p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Edit Item — {item.itemName}
          </h2>
          <Button variant="outline" onClick={() => onClose?.()} aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        {errorMsg ? (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Item Name
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Brake Pad Set"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Item Type
              </label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
                <option value="Part">Part</option>
                <option value="Whole">Whole</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                Vendor
              </label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              >
                <option value="">Select a vendor</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {vendorId && !isObjectId(vendorId) && (
                <p className="mt-1 text-xs text-destructive">
                  Vendor must be a 24-character ObjectId.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Location
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Warehouse A - Shelf 12"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                Description
              </label>
              <textarea
                className="min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes about the item"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose?.()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
