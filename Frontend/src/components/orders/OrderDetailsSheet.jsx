'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Calendar,
  DollarSign,
  Package,
  Truck,
  User,
  MapPin,
  Clock,
  FileText,
  X,
} from 'lucide-react';

// helpers
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Derive a current status from history if order.status is missing */
function deriveStatusFromHistory(order) {
  if (order?.status) return String(order.status);

  const hist = Array.isArray(order?.history) ? order.history : [];
  if (hist.length === 0) return undefined;

  let current;
  for (const h of hist) {
    const action = String(h?.action || '');

    const match = action.match(/^\s*([a-z_]+)\s*→\s*([a-z_]+)/i);
    if (match) {
      current = match[2];
      continue;
    }

    if (/order created/i.test(action) && !current) current = 'pending';
    if (/return accepted/i.test(action)) current = 'returned';
    if (/return request/i.test(action) && !current)
      current = 'return_requested';
    if (/cancelled/i.test(action)) current = 'cancelled';
  }
  return current;
}

function statusBadgeClasses(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending' || s === 'return_requested')
    return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'processing') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (s === 'shipped') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (s === 'delivered') return 'bg-green-100 text-green-800 border-green-200';
  if (s === 'returned' || s === 'cancelled')
    return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function getStatusIcon(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return <Clock className="h-4 w-4" />;
  if (s === 'processing') return <Package className="h-4 w-4" />;
  if (s === 'shipped') return <Truck className="h-4 w-4" />;
  if (s === 'delivered') return <Calendar className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export default function OrderDetailsSheet({
  open,
  onOpenChange,
  order,
  formatAddress,
}) {
  const displayStatus = useMemo(() => deriveStatusFromHistory(order), [order]);

  const sortedHistory = useMemo(() => {
    const list = Array.isArray(order?.history) ? order.history.slice() : [];
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [order]);

  const totalItems =
    order?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-4xl h-full p-0"
      >
        <div className="h-full overflow-y-auto">
          {/* Header Section */}
          <div className="sticky top-0 z-10 bg-background border-b p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-xl flex items-center gap-2">
                    Order #{order?.orderNumber || order?._id || '—'}
                    <Badge
                      className={`${statusBadgeClasses(
                        displayStatus
                      )} border font-medium flex items-center gap-1`}
                    >
                      {getStatusIcon(displayStatus)}
                      {displayStatus ? displayStatus.replace(/_/g, ' ') : '—'}
                    </Badge>
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
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
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Total Amount</Label>
                </div>
                <p className="text-2xl font-bold">
                  ${money(order?.totalAmount)}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Items</Label>
                </div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-sm text-muted-foreground">
                  {order?.items?.length || 0} product
                  {order?.items?.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Order Type</Label>
                </div>
                <p className="text-lg font-semibold capitalize">
                  {order?.orderType || '—'}
                </p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {order?.paymentStatus || '—'}
                  {order?.paymentMethod ? ` • ${order.paymentMethod}` : ''}
                </Badge>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Shipping Address */}
                <div className="bg-card rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">
                      Shipping Address
                    </Label>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                    {order?.shippingAddress ? (
                      formatAddress ? (
                        formatAddress(order.shippingAddress)
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">
                            {order.shippingAddress.fullName}
                          </div>
                          <div>{order.shippingAddress.street}</div>
                          <div>
                            {order.shippingAddress.city},{' '}
                            {order.shippingAddress.state}{' '}
                            {order.shippingAddress.zipCode}
                          </div>
                          <div>{order.shippingAddress.country}</div>
                          {order.shippingAddress.phone && (
                            <div className="mt-2">
                              📞 {order.shippingAddress.phone}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      'No shipping address provided'
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order?.notes && (
                  <div className="bg-card rounded-lg border p-4">
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

              {/* Right Column */}
              <div className="space-y-6">
                {/* Items Table */}
                <div className="bg-card rounded-lg border">
                  <div className="flex items-center gap-2 p-4 border-b">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">
                      Order Items ({order?.items?.length || 0})
                    </Label>
                  </div>
                  <div className="overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium">Product</th>
                          <th className="text-left p-3 font-medium">Qty</th>
                          <th className="text-right p-3 font-medium">Price</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order?.items || []).map((it, i) => {
                          const name =
                            it?.productItem?.itemName ||
                            it?.itemName ||
                            'Unnamed Product';
                          const sku = it?.productItem?.sku || it?.sku;
                          return (
                            <tr
                              key={it._id || it.id || i}
                              className="border-b hover:bg-muted/20 transition-colors"
                            >
                              <td className="p-3">
                                <div className="font-medium">{name}</div>
                                {sku && (
                                  <div className="text-xs text-muted-foreground">
                                    SKU: {sku}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">{it?.quantity ?? '—'}</td>
                              <td className="p-3 text-right">
                                ${money(it?.price || it?.unitPrice)}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant="outline"
                                  className="capitalize text-xs"
                                >
                                  {it?.status || '—'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order History */}
                <div className="bg-card rounded-lg border">
                  <div className="flex items-center gap-2 p-4 border-b">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">
                      Order History
                    </Label>
                  </div>
                  <div className="p-4">
                    {sortedHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No history available
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {sortedHistory.map((h, index) => (
                          <div key={h._id || h.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                              {index !== sortedHistory.length - 1 && (
                                <div className="w-0.5 h-full bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="font-medium text-sm">
                                {h.action || '—'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <User className="h-3 w-3" />
                                {h.performedBy || 'System'}
                                <span className="mx-1">•</span>
                                <Clock className="h-3 w-3" />
                                {h.createdAt
                                  ? new Date(h.createdAt).toLocaleString()
                                  : '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <SheetFooter className="pt-4 border-t">
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
