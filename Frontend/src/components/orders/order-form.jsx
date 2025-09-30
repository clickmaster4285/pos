'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Package, Calculator, Pencil } from 'lucide-react';

import { useGetAddressesQuery } from '@/features/addressApi';
import AddressUpsertDialog from './AddressUpsertDialog';
import DeleteAddressDialog from './DeleteAddressDialog';
/* ---------------- helpers ---------------- */

const toId = (x) => (x == null ? '' : String(x));
const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

function currency(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(n) ? n : 0);
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [
      {
        inventoryId: '',
        itemName: '',
        sku: '',
        quantity: 1,
        price: 0,
        costPrice: 0,
      },
    ];
  }
  return items.map((it) => ({
    inventoryId: String(it?.inventoryItem || it?.inventoryId || ''),
    sku: it?.sku || '',
    itemName: it?.itemName || '',
    quantity: Number(it?.quantity ?? 1),
    price: Number(it?.price ?? 0),
    costPrice: Number(it?.costPrice ?? 0),
  }));
}
// addresses

/* a tiny truncated text wrapper (for SelectItem labels etc.) */
function Truncate({ children, className, title }) {
  return (
    <span
      className={`block min-w-0 max-w-full truncate ${className || ''}`}
      title={
        typeof title === 'string'
          ? title
          : typeof children === 'string'
          ? children
          : undefined
      }
    >
      {children}
    </span>
  );
}

/* ---------------- component ---------------- */

export default function OrderForm({ onSubmit, loading, inventory }) {
  const [values, setValues] = useState({
    shippingAddressId: '',
    orderType: '',
    paymentMethod: '',
    notes: '',
    items: normalizeItems(),
  });

  const [errors, setErrors] = useState({
    orderType: '',
    paymentMethod: '',
    shippingAddressId: '',
    items: {},
  });

  const submitting = !!loading;

  /* addresses */
  const { data: addresses = [] } = useGetAddressesQuery();



// dialog state
const [openAddrCreate, setOpenAddrCreate] = useState(false);
const [openAddrEdit, setOpenAddrEdit] = useState(false);
const [openAddrDelete, setOpenAddrDelete] = useState(false);
const [selectedAddr, setSelectedAddr] = useState(null);

  useEffect(() => {
    if (!values.shippingAddressId && addresses.length) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def?._id) setValues((v) => ({ ...v, shippingAddressId: def._id }));
    }
  }, [addresses, values.shippingAddressId]);

  /* inventory maps */
  const invById = useMemo(() => {
    const m = new Map();
    (inventory || []).forEach((it) => {
      const id = String(it.id || it._id || '');
      if (id) m.set(id, it);
    });
    return m;
  }, [inventory]);

  const invOptions = useMemo(
    () =>
      (inventory || []).map((it) => ({
        id: String(it.id || it._id),
        label: it.itemName,
      })),
    [inventory]
  );

  /* backfill names/prices if we had an inventoryId stored */
  useEffect(() => {
    setValues((v) => ({
      ...v,
      items: v.items.map((row) => {
        if (row.itemName || !row.inventoryId) return row;
        const inv = invById.get(String(row.inventoryId));
        return inv
          ? {
              ...row,
              itemName: inv.itemName || '',
              price: row.price ?? 0,
              costPrice: row.costPrice ?? 0,
            }
          : row;
      }),
    }));
  }, [invById]);

  /* state helpers */
  const update = (patch) => setValues((v) => ({ ...v, ...patch }));
  const updateItem = (idx, patch) =>
    setValues((v) => ({
      ...v,
      items: v.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  const addItem = () =>
    setValues((v) => ({
      ...v,
      items: [
        ...v.items,
        {
          inventoryId: '',
          itemName: '',
          sku: '',
          quantity: 1,
          price: 0,
          costPrice: 0,
        },
      ],
    }));
  const removeItem = (idx) =>
    setValues((v) => ({ ...v, items: v.items.filter((_, i) => i !== idx) }));

  const totalAmount = useMemo(
    () =>
      values.items.reduce(
        (s, it) => s + Number(it.quantity || 0) * Number(it.price || 0),
        0
      ),
    [values.items]
  );

  /* validation */
  const validate = () => {
    const nextErrors = {
      orderType: values.orderType ? '' : 'Order type is required',
      paymentMethod: values.paymentMethod ? '' : 'Payment method is required',
      shippingAddressId: isObjectId(values.shippingAddressId)
        ? ''
        : 'Valid shipping address ID is required',
      items: {},
    };

    values.items.forEach((row, idx) => {
      const skuOk = typeof row.sku === 'string' && /^[A-Z0-9-]+$/.test(row.sku);
      const qtyOk =
        Number.isInteger(Number(row.quantity)) && Number(row.quantity) > 0;
      const itemErr = {
        sku: skuOk ? '' : 'Valid SKU required (A-Z, 0-9, hyphen)',
        quantity: qtyOk ? '' : 'Quantity must be a positive integer',
      };
      if (itemErr.sku || itemErr.quantity) nextErrors.items[idx] = itemErr;
    });

    setErrors(nextErrors);
    const top =
      nextErrors.orderType ||
      nextErrors.paymentMethod ||
      nextErrors.shippingAddressId;
    const item = Object.keys(nextErrors.items).length > 0;
    return !(top || item);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const itemsPayload = values.items
      .filter((it) => it.sku && Number(it.quantity) > 0)
      .map((it) => ({ sku: it.sku, quantity: Number(it.quantity) }));

    const payload = {
      items: itemsPayload,
      orderType: values.orderType,
      shippingAddressId: values.shippingAddressId.trim(),
      paymentMethod: values.paymentMethod,
      ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
    };

    await onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {/* Items */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base">Items</Label>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addItem}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="grid gap-3">
          {values.items.map((it, idx) => {
            const selectedInvId = toId(it.inventoryId);
            const inv = invById.get(selectedInvId) || null;
            const variants = inv?.variants || [];
            const selectedSku = it.sku || '';
            const itemErr = errors.items[idx] || {};
            const lineTotal = Number(it.quantity || 0) * Number(it.price || 0);

            return (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 mt-2 sm:grid-cols-12 hover:bg-muted/30 transition-colors"
              >
                {/* Item */}
                <div className="sm:col-span-4 grid gap-1.5 min-w-0">
                  <Label className="text-xs text-muted-foreground">Item</Label>
                  <Select
                    key={`${invOptions.length}-${selectedInvId}`}
                    value={selectedInvId || undefined}
                    onValueChange={(id) => {
                      const nextInv = invById.get(id);
                      // reset variant-related fields on item change
                      updateItem(idx, {
                        inventoryId: id,
                        itemName: nextInv?.itemName || '',
                        sku: '',
                        variantId: '',
                        price: 0,
                        costPrice: 0,
                        returnUnder: undefined,
                      });
                      // if exactly one variant, auto-select it immediately (no hooks in loop)
                      if (nextInv?.variants?.length === 1) {
                        const v = nextInv.variants[0];
                        updateItem(idx, {
                          sku: v.sku,
                          variantId: toId(v._id),
                          price: Number(v.price || 0),
                          costPrice: Number(v.costPrice || 0),
                          returnUnder: Number(v.returnUnder || 0),
                        });
                      }
                    }}
                  >
                    <SelectTrigger
                      className="
                        h-9 w-full min-w-0
                        [&>span]:block [&>span]:min-w-0 [&>span]:max-w-full [&>span]:truncate
                      "
                      title={it.itemName || undefined}
                    >
                      <SelectValue placeholder={it.itemName || 'Select item'} />
                    </SelectTrigger>
                    <SelectContent>
                      {invOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          <Truncate>{opt.label}</Truncate>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Variant */}
                <div className="sm:col-span-4 grid gap-1.5 min-w-0">
                  <Label className="text-xs text-muted-foreground">
                    Variant
                  </Label>
                  <Select
                    value={selectedSku || undefined}
                    onValueChange={(sku) => {
                      const v = (inv?.variants || []).find(
                        (vv) => String(vv.sku) === String(sku)
                      );
                      if (v) {
                        updateItem(idx, {
                          sku: v.sku, // controller needs SKU
                          variantId: toId(v._id),
                          price: Number(v.price || 0), // auto from variant
                          costPrice: Number(v.costPrice || 0),
                          returnUnder: Number(v.returnUnder || 0),
                        });
                      } else {
                        updateItem(idx, {
                          sku: '',
                          variantId: '',
                          price: 0,
                          costPrice: 0,
                          returnUnder: undefined,
                        });
                      }
                    }}
                    disabled={!inv}
                  >
                    <SelectTrigger
                      className={`
                        h-9 w-full min-w-0
                        ${itemErr.sku ? 'border-destructive' : ''}
                        [&>span]:block [&>span]:min-w-0 [&>span]:max-w-full [&>span]:truncate
                      `}
                      aria-invalid={!!itemErr.sku}
                      title={
                        selectedSku
                          ? (() => {
                              const vv = variants.find(
                                (x) => x.sku === selectedSku
                              );
                              return vv
                                ? `${vv.variantName} — ${vv.sku}`
                                : selectedSku;
                            })()
                          : undefined
                      }
                    >
                      <SelectValue
                        placeholder={
                          inv ? 'Select variant' : 'Select item first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(variants || []).map((v) => (
                        <SelectItem key={String(v._id)} value={String(v.sku)}>
                          <Truncate title={`${v.variantName} — ${v.sku}`}>
                            {v.variantName} — {v.sku}
                          </Truncate>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {itemErr.sku ? (
                    <p className="text-xs text-destructive mt-1">
                      {itemErr.sku}
                    </p>
                  ) : null}
                </div>

                {/* Qty */}
                <div className="sm:col-span-2 grid gap-1.5 min-w-0">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: Number(e.target.value) })
                    }
                    className={`h-9 ${
                      itemErr.quantity ? 'border-destructive' : ''
                    }`}
                    aria-invalid={!!itemErr.quantity}
                  />
                  {itemErr.quantity ? (
                    <p className="text-xs text-destructive mt-1">
                      {itemErr.quantity}
                    </p>
                  ) : null}
                </div>

                {/* Price (read-only) */}
                <div className="sm:col-span-2 grid gap-1.5 min-w-0">
                  <Label className="text-xs text-muted-foreground">Price</Label>
                  <div className="relative">
                    <Calculator className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={it.price}
                      readOnly
                      placeholder="0.00"
                      className="h-9 pl-8 read-only:bg-muted/40"
                      title="Price comes from selected variant"
                    />
                  </div>
                </div>

                {/* Line total + remove */}
                <div className="sm:col-span-12 flex items-end justify-between gap-2 sm:justify-end">
                  <div className="rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium">
                    {currency(lineTotal)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    disabled={values.items.length === 1}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Remove item ${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

     
      {/* Shipping Address */}
      <div className="grid gap-2">
        <Label>Shipping Address</Label>

        {/* Row 1: Select (full width, truncates) */}
        <div className="min-w-0">
          <Select
            value={values.shippingAddressId || undefined}
            onValueChange={(v) => {
              const found = addresses.find((a) => a._id === v) || null;
              setSelectedAddr(found);
              update({ shippingAddressId: v });
            }}
          >
            <SelectTrigger
              className={`
          h-9 w-full min-w-0 overflow-hidden truncate text-left
          ${errors.shippingAddressId ? 'border-destructive' : ''}
        `}
              aria-invalid={!!errors.shippingAddressId}
              title={(() => {
                const a = addresses.find(
                  (x) => x._id === values.shippingAddressId
                );
                return a
                  ? `${a.fullName} — ${a.addressLine1}, ${a.city}${
                      a.isDefault ? ' (default)' : ''
                    }`
                  : undefined;
              })()}
            >
              <div className="truncate">
                <SelectValue placeholder="Choose shipping address" />
              </div>
            </SelectTrigger>

            <SelectContent
              position="popper"
              className="w-[var(--radix-select-trigger-width)] max-w-full max-h-72 overflow-y-auto"
            >
              {addresses.map((a) => (
                <SelectItem key={a._id} value={a._id} className="max-w-full">
                  <span
                    className="block max-w-full truncate"
                    title={`${a.fullName} — ${a.addressLine1}, ${a.city}${
                      a.isDefault ? ' (default)' : ''
                    }`}
                  >
                    {a.fullName} — {a.addressLine1}, {a.city}
                    {a.isDefault ? ' (default)' : ''}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.shippingAddressId ? (
            <p className="text-xs text-destructive mt-1">
              {errors.shippingAddressId}
            </p>
          ) : null}
        </div>

        {/* Row 2: Actions (next row, align right; change to justify-start if you want left) */}
        <div className="flex items-center gap-2 justify-end flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => setOpenAddrCreate(true)}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!values.shippingAddressId}
            onClick={() => {
              const curr =
                addresses.find((a) => a._id === values.shippingAddressId) ||
                null;
              setSelectedAddr(curr);
              setOpenAddrEdit(true);
            }}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-2"
            disabled={!values.shippingAddressId}
            onClick={() => {
              const curr =
                addresses.find((a) => a._id === values.shippingAddressId) ||
                null;
              setSelectedAddr(curr);
              setOpenAddrDelete(true);
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>

        {/* dialogs (unchanged) */}
        <AddressUpsertDialog
          open={openAddrCreate}
          onOpenChange={setOpenAddrCreate}
          mode="create"
          onSaved={(res) => {
            const addr = res?.address || res;
            if (addr?._id) {
              update({ shippingAddressId: addr._id });
              setSelectedAddr(addr);
            }
          }}
        />
        <AddressUpsertDialog
          open={openAddrEdit}
          onOpenChange={setOpenAddrEdit}
          mode="edit"
          initialAddress={selectedAddr}
          onSaved={(res) => {
            const addr = res?.address || res;
            if (addr?._id && values.shippingAddressId === addr._id)
              setSelectedAddr(addr);
          }}
        />
        <DeleteAddressDialog
          open={openAddrDelete}
          onOpenChange={setOpenAddrDelete}
          address={selectedAddr}
          onDeleted={(deletedId) => {
            if (values.shippingAddressId === deletedId) {
              const fresh = addresses.filter((a) => a._id !== deletedId);
              const def = fresh.find((a) => a.isDefault) || fresh[0] || null;
              update({ shippingAddressId: def?._id || '' });
              setSelectedAddr(def);
            }
          }}
        />
      </div>

      {/* Meta selects */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="grid gap-2 min-w-0">
          <Label>Payment Method</Label>
          <Select
            value={values.paymentMethod || undefined}
            onValueChange={(v) => update({ paymentMethod: v })}
          >
            <SelectTrigger
              className={`
                h-9 w-full min-w-0
                ${errors.paymentMethod ? 'border-destructive' : ''}
                [&>span]:block [&>span]:min-w-0 [&>span]:max-w-full [&>span]:truncate
              `}
              aria-invalid={!!errors.paymentMethod}
            >
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="debit_card">Debit Card</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cod">Cash on Delivery</SelectItem>
            </SelectContent>
          </Select>
          {errors.paymentMethod ? (
            <p className="text-xs text-destructive mt-1">
              {errors.paymentMethod}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 min-w-0">
          <Label>Order Type</Label>
          <Select
            value={values.orderType || undefined}
            onValueChange={(v) => update({ orderType: v })}
          >
            <SelectTrigger
              className={`
                h-9 w-full min-w-0
                ${errors.orderType ? 'border-destructive' : ''}
                [&>span]:block [&>span]:min-w-0 [&>span]:max-w-full [&>span]:truncate
              `}
              aria-invalid={!!errors.orderType}
            >
              <SelectValue placeholder="Select order type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
          {errors.orderType ? (
            <p className="text-xs text-destructive mt-1">{errors.orderType}</p>
          ) : null}
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={values.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Delivery window, special handling, etc."
          rows={3}
          className="resize-y"
        />
      </div>

      {/* Total */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-muted/40 p-4">
        <div className="text-sm text-muted-foreground">
          Review your items before submitting.
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-sm font-medium">Total Amount</span>
          <span className="rounded-md bg-background px-3 py-1.5 text-base font-semibold shadow-sm">
            {currency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitting} className="min-w-36">
          {submitting ? 'Saving...' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
}
