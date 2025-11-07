'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Calendar,
  DollarSign,
  Package,
  Clock,
  FileText,
  X,
  Tag,
  User,
  Info,
} from 'lucide-react';

// ---------- helpers ----------
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const titleCase = (s) =>
  String(s || '—')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());

function deriveStatus(order) {
  const direct = String(order?.orderStatus || order?.status || '').trim();
  if (direct) return direct;

  const hist = Array.isArray(order?.history) ? order.history : [];
  if (!hist.length) return 'pending';

  let current = 'pending';
  for (const h of hist) {
    const a = String(h?.action || '').toLowerCase();
    if (/billed/.test(a)) current = 'completed';
    if (/create/.test(a) && !current) current = 'pending';
    if (/cancel/.test(a)) current = 'cancelled';
    if (/delivered/.test(a)) current = 'delivered';
    if (/return/.test(a)) current = 'returned';
  }
  return current;
}

function statusBadgeClasses(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending' || s === 'return_requested')
    return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'processing' || s === 'in_progress')
    return 'bg-blue-100 text-blue-800 border-blue-200';
  if (s === 'shipped' || s === 'ready')
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (s === 'delivered' || s === 'completed')
    return 'bg-green-100 text-green-800 border-green-200';
  if (['returned', 'cancelled', 'refunded', 'partially_refunded'].includes(s))
    return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function getStatusIcon(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return <Clock className="h-4 w-4" />;
  if (s === 'processing' || s === 'in_progress')
    return <Package className="h-4 w-4" />;
  if (s === 'shipped' || s === 'ready') return <Tag className="h-4 w-4" />;
  if (s === 'delivered' || s === 'completed')
    return <Calendar className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function countTotalUnits(items = []) {
  return items.reduce(
    (sum, it) => sum + Number(it?.qty ?? it?.quantity ?? 0),
    0
  );
}

function getTotalAmount(order) {
  if (typeof order?.subTotal === 'number') return order.subTotal;
  if (typeof order?.totalAmount === 'number') return order.totalAmount;
  const items = Array.isArray(order?.items) ? order.items : [];
  const sum = items.reduce(
    (s, it) =>
      s +
      Number(it?.total ?? (it?.price ?? 0) * (it?.qty ?? it?.quantity ?? 0)),
    0
  );
  return sum;
}

export default function OrderDetailsSheet({ open, onOpenChange, order }) {
  const status = useMemo(() => deriveStatus(order), [order]);
  const totalAmount = useMemo(() => getTotalAmount(order), [order]);

  const sortedHistory = useMemo(() => {
    const list = Array.isArray(order?.history) ? [...order.history] : [];
    return list.sort(
      (a, b) =>
        new Date(b?.createdAt || 0).getTime() -
        new Date(a?.createdAt || 0).getTime()
    );
  }, [order]);

  const items = Array.isArray(order?.items) ? order.items : [];
  const totalUnits = countTotalUnits(items);

  const orderNo = order?.orderNo || order?.orderNumber || order?._id || '—';
  const payStatus = String(order?.paymentStatus || '—');
  const payMethod = String(order?.paymentMethod || '').trim();
  const orderType =
    order?.dynamicAttributes?.orderType ||
    order?.orderType ||
    order?.type ||
    '—';

  const extraAttrs = {
    brand: order?.dynamicAttributes?.brand,
    size: order?.dynamicAttributes?.size,
    color: order?.dynamicAttributes?.color,
  };
  const hasExtras = Object.values(extraAttrs).some(
    (v) => v !== undefined && v !== null && String(v).trim() !== ''
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl h-full p-0"
      >
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-xl flex items-center gap-2">
                    <span className="truncate">Order #{orderNo}</span>
                    <Badge
                      className={`${statusBadgeClasses(
                        status
                      )} border font-medium flex items-center gap-1 shrink-0`}
                    >
                      {getStatusIcon(status)}
                      {titleCase(status)}
                    </Badge>
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1 text-sm">
                    <Calendar className="h-4 w-4" />
                    {order?.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : 'No date available'}
                  </SheetDescription>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange?.(false)}
                className="h-8 w-8 shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Total Amount</Label>
                </div>
                <p className="text-2xl font-bold">${money(totalAmount)}</p>
                {typeof order?.subTotal === 'number' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Subtotal source
                  </p>
                )}
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Items</Label>
                </div>
                <p className="text-2xl font-bold">{totalUnits}</p>
                <p className="text-sm text-muted-foreground">
                  {items.length} product{items.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Type & Payment</Label>
                </div>
                <p className="text-lg font-semibold capitalize">
                  {titleCase(orderType)}
                </p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {titleCase(payStatus)}
                  {payMethod ? ` • ${titleCase(payMethod)}` : ''}
                </Badge>
              </div>
            </div>

            {/* Details / Notes (2-col on lg) */}
            {(hasExtras || order?.notes) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Details */}
                {hasExtras && (
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-semibold">
                        Order Details
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {extraAttrs.brand && (
                        <div>
                          <span className="font-medium">Brand:</span>{' '}
                          <span className="opacity-90">{extraAttrs.brand}</span>
                        </div>
                      )}
                      {extraAttrs.size && (
                        <div>
                          <span className="font-medium">Size:</span>{' '}
                          <span className="opacity-90">{extraAttrs.size}</span>
                        </div>
                      )}
                      {extraAttrs.color && (
                        <div>
                          <span className="font-medium">Color:</span>{' '}
                          <span className="opacity-90">{extraAttrs.color}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {order?.notes && (
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-semibold">
                        Order Notes
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* --- FULL WIDTH: Order Items --- */}
            <section className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between gap-2 p-4 border-b">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">
                    Order Items ({items.length})
                  </Label>
                </div>
              </div>

              <div className="overflow-auto max-h-[45vh] ">
                <table className="w-full text-sm bg-muted/10">
                  <thead className="sticky top-0 backdrop-blur">
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-left p-3 font-medium">Qty</th>
                      <th className="text-right p-3 font-medium">Price</th>
                      <th className="text-right p-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => {
                      const name =
                        it?.productItem?.itemName ||
                        it?.name ||
                        it?.itemName ||
                        'Unnamed Product';
                      const qty = it?.qty ?? it?.quantity ?? 0;
                      const price = it?.price ?? it?.unitPrice ?? 0;
                      const total = it?.total ?? price * qty;
                      return (
                        <tr
                          key={it?._id || it?.id || i}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-medium">{name}</div>
                            {it?.sku ? (
                              <div className="text-xs text-muted-foreground">
                                SKU: {it.sku}
                              </div>
                            ) : null}
                          </td>
                          <td className="p-3">{qty}</td>
                          <td className="p-3 text-right">${money(price)}</td>
                          <td className="p-3 text-right font-medium">
                            ${money(total)}
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* --- FULL WIDTH: Order History --- */}
            <section className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 p-4 border-b">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Order History</Label>
              </div>

              <div className="p-4">
                {sortedHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No history available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sortedHistory.map((h, index) => (
                      <div
                        key={h?._id || h?.id || index}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                          {index !== sortedHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium text-sm">
                            {h?.action || '—'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            {h?.performedBy || 'System'}
                            <span className="mx-1">•</span>
                            <Clock className="h-3 w-3" />
                            {h?.createdAt
                              ? new Date(h.createdAt).toLocaleString()
                              : '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Footer */}
            <SheetFooter className="pt-2 border-t">
              <div className="flex w-full items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {order?.updatedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last updated: {new Date(order.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange?.(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
