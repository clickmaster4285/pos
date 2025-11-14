'use client';

import React, { useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  User,
  ShoppingCart,
  History as HistoryIcon,
  RefreshCw,
  FileText,
} from 'lucide-react';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}
function fmtShort(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}
function money(n, symbol = '₨') {
  const v = Number(n || 0);
  return `${symbol}${v.toFixed(2)}`;
}
const statusTone = (s) => {
  const k = String(s || '').toLowerCase();
  if (k === 'paid') return 'bg-green-100 text-green-800 border-green-200';
  if (k === 'refunded') return 'bg-red-100 text-red-800 border-red-200';
  if (k === 'partially_refunded')
    return 'bg-amber-100 text-amber-800 border-amber-200';
  if (k === 'pending') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

// Renders any dynamicAttributes as small chips: key: value

export default function BillDetailsSheet({
  open,
  onOpenChange,
  bill,
  onPrint,
  currencySymbol = '₨',
}) {
  const [tab, setTab] = useState('items');

  const billNumber = bill?.billNumber;
  const status = bill?.status;
  const createdAt = bill?.createdAt;
  const updatedAt = bill?.updatedAt;

  const buyer = bill?.buyer || {};
  const items = Array.isArray(bill?.items) ? bill.items : [];
  const refundDetails = bill?.refundDetails || null;
  const historyRaw = Array.isArray(bill?.history) ? bill.history : [];

  // Map items from your structure:
  // root: itemName, quantity, price, total, refundAmount, dynamicAttributes{...}
  const mappedItems = useMemo(() => {
    return items.map((row) => {
      const dyn = row?.dynamicAttributes || {};
      const qty = Number(row?.quantity ?? dyn.quantity ?? 0);
      const price = Number(row?.price ?? dyn.price ?? 0);
      const lineTotal = Number(row?.total ?? qty * price);
      const refundAmount = Number(row?.refundAmount ?? dyn.refundAmount ?? 0);
      return {
        id: row?._id || row?.OrderItemId || row?.ProductId,
        itemName: row?.itemName || dyn.itemName || '—',
        attrs: dyn,
        quantity: qty,
        price,
        total: lineTotal,
        refundAmount,
      };
    });
  }, [items]);

  // Subtotal / discount / tax / total (current)
  const totals = useMemo(() => {
    const givenSubtotal = Number(bill?.subtotal ?? 0);
    const taxPercent = Number(bill?.taxPercent ?? 0);
    const givenTaxAmount = Number(bill?.taxAmount ?? 0);
    const givenTotal = bill?.total !== undefined ? Number(bill.total) : NaN;

    const discountPercent = Number(bill?.discountPercent ?? 0);
    const givenDiscountAmount = Number(bill?.discountAmount ?? 0);

    const computedSubtotal =
      givenSubtotal ||
      mappedItems.reduce((s, it) => s + (Number(it.total) || 0), 0);

    const discountAmount =
      givenDiscountAmount || (computedSubtotal * (discountPercent || 0)) / 100;

    const taxableBase = Math.max(computedSubtotal - discountAmount, 0);

    const taxAmount = givenTaxAmount || (taxableBase * (taxPercent || 0)) / 100;

    const total = Number.isFinite(givenTotal)
      ? givenTotal
      : taxableBase + taxAmount;

    return {
      subtotal: computedSubtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      total,
    };
  }, [bill, mappedItems]);

  // Total refunded (bill-level or per-item fallback)
  const refundedAmount = useMemo(() => {
    const topLevel =
      Number(bill?.refundDetails?.totalRefundAmount ?? 0) ||
      Number(bill?.totalRefundAmount ?? 0);

    if (topLevel) return topLevel;

    // fallback: sum from items
    return items.reduce((sum, item) => {
      if (!item) return sum;

      if (item.refundAmount != null) {
        return sum + Number(item.refundAmount || 0);
      }

      const hist = Array.isArray(item.refundHistory) ? item.refundHistory : [];
      const histSum = hist.reduce((s, r) => s + Number(r.refundAmount || 0), 0);

      return sum + histSum;
    }, 0);
  }, [bill, items]);

  // current total (already after refunds in your backend)
  const netTotal = totals.total;
  // approximate "original" total before refunds
  const originalTotal = netTotal + refundedAmount;

  // Flatten per-item refund history for display
  const refundHistory = useMemo(() => {
    const rows = [];

    if (Array.isArray(items)) {
      for (const item of items) {
        const itemName =
          item?.itemName || item?.dynamicAttributes?.itemName || '—';
        const hist = Array.isArray(item?.refundHistory)
          ? item.refundHistory
          : [];

        hist.forEach((r) => {
          rows.push({
            _id: r._id,
            itemName,
            refundQuantity: r.refundQuantity,
            refundAmount: r.refundAmount,
            refundReason: r.refundReason,
            refundedBy: r.refundedBy,
            refundedAt: r.refundedAt,
          });
        });
      }
    }

    return rows;
  }, [items]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-6 overflow-y-auto"
      >
        {/* Header */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                Bill Details
                {billNumber && (
                  <span className="text-muted-foreground text-sm font-normal bg-muted px-2 py-1 rounded">
                    #{billNumber}
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4" />
                Created: {fmtDate(createdAt)}
              </SheetDescription>
            </div>
            <Badge
              className={`${statusTone(status)} border px-3 py-1 font-medium`}
            >
              {String(status || '—').replaceAll('_', ' ')}
            </Badge>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Items
            </TabsTrigger>

            <TabsTrigger value="history" className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          {/* ITEMS TAB */}
          <TabsContent value="items" className="mt-6 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Subtotal</div>
                  <div className="text-lg font-semibold">
                    {money(totals.subtotal, currencySymbol)}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    Discount
                    {totals.discountPercent
                      ? ` (${totals.discountPercent}%)`
                      : ''}
                  </div>
                  <div className="text-lg font-semibold">
                    {money(totals.discountAmount, currencySymbol)}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    Tax ({totals.taxPercent}%)
                  </div>
                  <div className="text-lg font-semibold">
                    {money(totals.taxAmount, currencySymbol)}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Refunded</div>
                  <div className="text-lg font-semibold text-amber-700">
                    {money(refundedAmount, currencySymbol)}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    Total (Current)
                  </div>
                  <div className="text-lg font-semibold">
                    {money(netTotal, currencySymbol)}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    Payment Method
                  </div>
                  <div className="text-lg font-semibold capitalize">
                    {bill?.paymentMethod || '—'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Payment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Customer &amp; Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {buyer?.name || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Email: {buyer?.email || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Phone: {buyer?.phone || '—'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Payment Details
                  </div>
                  <div className="font-medium capitalize">
                    Method: {bill?.paymentMethod || '—'}
                  </div>
                  {bill?.paymentNumber && (
                    <div className="text-xs text-muted-foreground">
                      Reference: {bill.paymentNumber}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Original Total (approx):{' '}
                    <span className="font-semibold">
                      {money(originalTotal, currencySymbol)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Items ({mappedItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Item</TableHead>

                      <TableHead className="text-right font-medium">
                        Price
                      </TableHead>
                      <TableHead className="text-right font-medium">
                        Qty
                      </TableHead>

                      <TableHead className="text-right font-medium">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      mappedItems.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="align-top">
                            <div className="font-medium">{it.itemName}</div>
                          </TableCell>

                          <TableCell className="text-right align-top">
                            {money(it.price, currencySymbol)}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            {it.quantity}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            {money(it.total, currencySymbol)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Refund Summary + Refund History */}
            {(refundDetails || refundHistory.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {refundDetails && (
                  <Card className="border-amber-200 bg-amber-50/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refund Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Refunded
                        </span>
                        <span className="font-semibold text-amber-800">
                          {money(
                            refundDetails.totalRefundAmount,
                            currencySymbol
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Refunded By
                        </span>
                        <span className="font-semibold">
                          {refundDetails.refundedBy || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Refunded At
                        </span>
                        <span className="font-semibold">
                          {fmtDate(refundDetails.refundedAt)}
                        </span>
                      </div>
                      {refundDetails.refundReason && (
                        <div className="pt-2 border-t text-sm">
                          <span className="text-muted-foreground">
                            Reason:{' '}
                          </span>
                          {refundDetails.refundReason}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {refundHistory.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Refund History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="font-medium">Item</TableHead>
                            <TableHead className="font-medium">Qty</TableHead>
                            <TableHead className="font-medium">
                              Amount
                            </TableHead>
                            <TableHead className="font-medium">
                              Reason
                            </TableHead>

                            <TableHead className="font-medium">At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {refundHistory.map((r) => (
                            <TableRow key={r._id}>
                              <TableCell>{r.itemName || '—'}</TableCell>
                              <TableCell>{r.refundQuantity}</TableCell>
                              <TableCell>
                                {money(r.refundAmount, currencySymbol)}
                              </TableCell>
                              <TableCell>{r.refundReason || '—'}</TableCell>

                              <TableCell>{fmtDate(r.refundedAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-6">
            {historyRaw.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No history available
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Activity Timeline ({historyRaw.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {historyRaw.map((h, idx) => (
                      <div key={h._id || idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                          {idx < historyRaw.length - 1 && (
                            <div className="w-px h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="font-medium text-sm">
                              {h.action || '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fmtShort(h.createdAt)}
                            </div>
                          </div>
                          {h.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {h.notes}
                            </p>
                          )}
                          {h.performedBy && (
                            <div className="text-xs text-muted-foreground mt-1">
                              By {h.performedBy}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <SheetFooter className="mt-6 pt-4 border-t">
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-muted-foreground flex flex-col">
             
              <span>Updated: {fmtDate(updatedAt)}</span>
            </div>

            {onPrint && (
              <Button variant="outline" size="sm" onClick={() => onPrint(bill)}>
                Print Bill
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
