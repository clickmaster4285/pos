'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCreateInventoryItemMutation } from '@/features/inventoryApi';
import { X } from 'lucide-react';

export default function CreateInventoryModal({
  open,
  onClose,
  onCreated,
  vendors = [],
}) {
  // Normalize vendors to { id, name, email, phone }
  const vendorOptions = useMemo(
    () =>
      (Array.isArray(vendors) ? vendors : []).map((v) => ({
        id: String(v._id || v.id || v.vendorId || ''),
        name: v.name || 'Unnamed vendor',
        email: v.email || '',
        phone: v.phone || '',
        raw: v,
      })),
    [vendors]
  );

  // Basic fields
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Part');
  const [description, setDescription] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');

  // Variants with SKU support
  const [variants, setVariants] = useState([
    {
      variantName: '',
      incomingQuantity: '',
      price: '',
      costPrice: '',
      returnUnder: 7,
      attributes: { size: '', material: '' },
      customSku: '', // New field for custom SKU
      showCustomSku: false, // Toggle for SKU input field
    },
  ]);

  const [errorMsg, setErrorMsg] = useState('');

  // RTK Query mutation
  const [createInventoryItem, { isLoading: submitting }] =
    useCreateInventoryItemMutation();

  const addVariant = () => {
    setVariants((v) => [
      {
        variantName: '',
        incomingQuantity: '',
        price: '',
        costPrice: '',
        returnUnder: 7,
        attributes: { size: '', material: '' },
        customSku: '',
        showCustomSku: false,
      },
      ...v,
    ]);
  };

  const removeVariant = (idx) => {
    setVariants((v) => v.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx, field, value) => {
    setVariants((v) =>
      v.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const updateVariantAttr = (idx, key, value) => {
    setVariants((v) =>
      v.map((row, i) =>
        i === idx
          ? { ...row, attributes: { ...row.attributes, [key]: value } }
          : row
      )
    );
  };

  const toggleCustomSku = (idx) => {
    setVariants((v) =>
      v.map((row, i) =>
        i === idx ? { ...row, showCustomSku: !row.showCustomSku } : row
      )
    );
  };

  const resetForm = () => {
    setItemName('');
    setItemType('Part');
    setDescription('');
    setVendorId('');
    setLocation('');
    setReason('');
    setComments('');
    setVariants([
      {
        variantName: '',
        incomingQuantity: '',
        price: '',
        costPrice: '',
        returnUnder: 7,
        attributes: { size: '', material: '' },
        customSku: '',
        showCustomSku: false,
      },
    ]);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic validation
    if (!itemName.trim()) return setErrorMsg('Item name is required');
    if (!vendorId) return setErrorMsg('Vendor is required');
    if (!location.trim()) return setErrorMsg('Location is required');
    if (variants.length === 0) return setErrorMsg('Add at least one variant');

    const payload = {
      itemName: itemName.trim(),
      itemType,
      description: description.trim(),
      vendor: vendorId,
      location: location.trim(),
      reason: reason.trim(),
      comments: comments.trim(),
      variants: variants.map((v) => ({
        variantName: String(v.variantName || '').trim(),
        incomingQuantity: Number(v.incomingQuantity || 0),
        price: Number(v.price || 0),
        costPrice: Number(v.costPrice || 0),
        returnUnder: Number(v.returnUnder || 0),
        customSku: v.customSku ? String(v.customSku).trim() : undefined, // Include custom SKU if provided
        attributes: {
          ...(v.attributes?.size ? { size: v.attributes.size } : {}),
          ...(v.attributes?.material
            ? { material: v.attributes.material }
            : {}),
        },
      })),
    };

    // Per-variant checks
    for (const v of payload.variants) {
      if (!v.variantName) return setErrorMsg('Each variant needs a name');
      if (!Number.isFinite(v.incomingQuantity) || v.incomingQuantity <= 0)
        return setErrorMsg(
          'Variant incoming quantity must be a positive number'
        );
      if (!Number.isFinite(v.price) || v.price <= 0)
        return setErrorMsg('Variant price must be a positive number');
      if (!Number.isFinite(v.costPrice) || v.costPrice < 0)
        return setErrorMsg('Variant cost must be zero or positive');
      if (v.customSku && !v.customSku.trim())
        return setErrorMsg('Custom SKU cannot be empty if provided');
    }

    try {
      const res = await createInventoryItem(payload).unwrap();
      onCreated?.(res?.data || res || payload);
      resetForm();
      onClose?.();
    } catch (err) {
      setErrorMsg(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          'Failed to create inventory'
      );
    }
  };

  if (!open) return null;

  const selectedVendor = vendorOptions.find((v) => v.id === vendorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-xl border bg-background p-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Inventory Item</h2>
          <Button variant="outline" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {errorMsg ? (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        {!vendorOptions.length ? (
          <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-900">
            No vendors found. Add a vendor first or refresh this page.
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
                Description
              </label>
              <textarea
                className="min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-quality brake pads suitable for multiple vehicle models"
              />
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
                    {v.name} {v.email ? `• ${v.email}` : ''}{' '}
                    {v.phone ? `• ${v.phone}` : ''}
                  </option>
                ))}
              </select>

              {selectedVendor ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Selected:</span>{' '}
                    {selectedVendor.name}
                  </div>
                  {selectedVendor.email ? (
                    <div>Email: {selectedVendor.email}</div>
                  ) : null}
                  {selectedVendor.phone ? (
                    <div>Phone: {selectedVendor.phone}</div>
                  ) : null}
                </div>
              ) : null}
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

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Reason
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="New stock purchase"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Comments
              </label>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Initial stock entry from vendor contract"
              />
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">Variants</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
              >
                Add variant
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div key={idx} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium">
                      Variant #{idx + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCustomSku(idx)}
                      >
                        {v.showCustomSku ? 'Hide Custom SKU' : 'Custom SKU'}
                      </Button>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariant(idx)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Variant Name
                      </label>
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.variantName}
                        onChange={(e) =>
                          updateVariant(idx, 'variantName', e.target.value)
                        }
                        placeholder="Front Brake Pad - Medium"
                      />
                    </div>

                    {v.showCustomSku && (
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Custom SKU
                        </label>
                        <input
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                          value={v.customSku}
                          onChange={(e) =>
                            updateVariant(idx, 'customSku', e.target.value)
                          }
                          placeholder="Enter unique SKU (e.g., SKU-123)"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Incoming Qty
                      </label>
                      <input
                        type="number"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.incomingQuantity}
                        onChange={(e) =>
                          updateVariant(idx, 'incomingQuantity', e.target.value)
                        }
                        placeholder="50"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Cost Price
                      </label>
                      <input
                        type="number"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.costPrice}
                        onChange={(e) =>
                          updateVariant(idx, 'costPrice', e.target.value)
                        }
                        placeholder="2000"
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Price
                      </label>
                      <input
                        type="number"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.price}
                        onChange={(e) =>
                          updateVariant(idx, 'price', e.target.value)
                        }
                        placeholder="2500"
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Return Under (days)
                      </label>
                      <input
                        type="number"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.returnUnder}
                        onChange={(e) =>
                          updateVariant(idx, 'returnUnder', e.target.value)
                        }
                        placeholder="7"
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Attribute: Size
                      </label>
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.attributes?.size || ''}
                        onChange={(e) =>
                          updateVariantAttr(idx, 'size', e.target.value)
                        }
                        placeholder="Medium"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Attribute: Material
                      </label>
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.attributes?.material || ''}
                        onChange={(e) =>
                          updateVariantAttr(idx, 'material', e.target.value)
                        }
                        placeholder="Ceramic"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !vendorOptions.length}
            >
              {submitting ? 'Creating…' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 