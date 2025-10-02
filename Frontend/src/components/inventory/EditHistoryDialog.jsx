'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';
import { useUpdateInventoryItemMutation, useGetInventoryByIdQuery } from '@/features/inventoryApi';

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v || ''));

export default function EditHistoryDialog({ open, item, onClose, defaultHistoryId = '' }) {
  const [updateHistory, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
  const { data: inventoryData, isLoading: isFetching } = useGetInventoryByIdQuery(item?.id || item?._id, {
    skip: !open || !item,
  });
  console.log("the item detila of inventoryData is: ", inventoryData)

  const variants = useMemo(
    () =>
      Array.isArray(item?.variants)
        ? item.variants.map((v) => ({
            id: String(v.id || v._id),
            variantName: v.variantName || '—',
            sku: v.sku || '',
            price: v.price || 0,
            costPrice: v.costPrice || 0,
          }))
        : [],
    [item]
  );

  const historyOptions = useMemo(
    () =>
      Array.isArray(inventoryData?.historySummary)
        ? inventoryData.historySummary.map((h) => ({
            id: String(h._id || h.id),
            sequence: h.sequence || 0,
            action: h.action || '—',
            description: h.description || '—',
            createdAt: h.createdAt ? new Date(h.createdAt).toLocaleString() : '—',
          }))
        : [],
    [inventoryData]
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
    if (!open || !item) return;
    setErrorMsg('');
    setHistoryId(defaultHistoryId || '');
    setVariantId(variants[0]?.id || '');
    setIncomingQuantity('0');
    setPrice('');
    setCostPrice('');
    setSku(variants[0]?.sku || '');
    setReason('Audit stock correction');
    setComments('Adjusted via history edit');
  }, [open, item, defaultHistoryId, variants]);

  useEffect(() => {
    if (historyId && inventoryData?.historySummary) {
      const selectedHistory = inventoryData.historySummary.find(
        (h) => String(h._id || h.id) === historyId
      );
      if (selectedHistory) {
        setReason(selectedHistory.reason || 'Audit stock correction');
        setComments(selectedHistory.comments || 'Adjusted via history edit');
      }
    }
  }, [historyId, inventoryData]);

  useEffect(() => {
    if (variantId && variants.length) {
      const selectedVariant = variants.find((v) => v.id === variantId);
      if (selectedVariant) {
        setSku(selectedVariant.sku || '');
        setPrice(selectedVariant.price?.toString() || '');
        setCostPrice(selectedVariant.costPrice?.toString() || '');
      }
    }
  }, [variantId, variants]);

  if (!open || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isObjectId(historyId)) {
      return setErrorMsg('Please select a valid history entry.');
    }
    if (!variantId) {
      return setErrorMsg('Please choose a variant to edit.');
    }
    const q = Number(incomingQuantity);
    if (!Number.isFinite(q) || q < 0) {
      return setErrorMsg('Incoming quantity must be a non-negative number.');
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
        inventoryId: item.id || item._id,
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onClose?.()} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Edit Inventory History — {item.itemName}
          </h2>
          <Button
            variant="ghost"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              History Entry
            </label>
            {isFetching ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading history...</div>
            ) : (
              <select
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                value={historyId}
                onChange={(e) => setHistoryId(e.target.value)}
              >
                <option value="">Select a history entry</option>
                {historyOptions.map((h) => (
                  <option key={h.id} value={h.id}>
                    #{h.sequence} - {h.action} - {h.description}  ({h.createdAt}) 
                  </option>
                ))}
              </select>
            )}
            {historyId && !isObjectId(historyId) && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Must be a valid history entry.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Variant
            </label>
            <select
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
            >
              <option value="">Select a variant</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.variantName} {v.sku ? `(${v.sku})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Incoming Quantity
              </label>
              <input
                type="number"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                value={incomingQuantity}
                onChange={(e) => setIncomingQuantity(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SKU
              </label>
              <input
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PAR-XXXX-123"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price
              </label>
              <input
                type="number"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cost Price
              </label>
              <input
                type="number"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="1000"
                min="0"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason
              </label>
              <input
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Audit stock correction"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Comments
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Adjusted via history edit"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => onClose?.()}
              disabled={isUpdating || isFetching}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={isUpdating || isFetching}
            >
              {isUpdating ? 'Updating...' : 'Update History'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}