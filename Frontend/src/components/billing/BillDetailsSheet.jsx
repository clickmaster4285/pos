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
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  User,
  ShoppingCart,
  History as HistoryIcon,
  RefreshCw,
  Printer,
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
function AttrChips({ attrs }) {
  const entries = Object.entries(attrs || {}).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
  );
  if (!entries.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="text-[11px] px-2 py-0.5 rounded-full border bg-muted/50"
          title={`${k}: ${v}`}
        >
          <span className="capitalize">{k}</span>: {String(v)}
        </span>
      ))}
    </div>
  );
}

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
  const refundHistory = Array.isArray(bill?.refundHistory)
    ? bill.refundHistory
    : [];
  const history = Array.isArray(bill?.history) ? bill.history : [];

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
        itemName: row?.itemName || '—',
        attrs: dyn,
        quantity: qty,
        price,
        total: lineTotal,
        refundAmount,
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    const givenSubtotal = Number(bill?.subtotal ?? 0);
    const taxPercent = Number(bill?.taxPercent ?? 0);
    const givenTaxAmount = Number(bill?.taxAmount ?? 0);
    const givenTotal = bill?.total !== undefined ? Number(bill.total) : NaN;

    const computedSubtotal =
      givenSubtotal ||
      mappedItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const taxAmount =
      givenTaxAmount || (computedSubtotal * (taxPercent || 0)) / 100;
    const total = Number.isFinite(givenTotal)
      ? givenTotal
      : computedSubtotal + taxAmount;

    return { subtotal: computedSubtotal, taxPercent, taxAmount, total };
  }, [bill, mappedItems]);

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

          {/* ITEMS */}
          <TabsContent value="items" className="mt-6 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Subtotal</div>
                  <div className="text-lg font-semibold">
                    {money(totals.subtotal, currencySymbol)}
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
                  <div className="text-xs text-muted-foreground">
                    Payment Method
                  </div>
                  <div className="text-lg font-semibold capitalize">
                    {bill?.paymentMethod || '—'}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-semibold">
                    {money(totals.total, currencySymbol)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table: itemName, dynamicAttributes (chips), Qty, Price, Total, Refund Amount */}
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
                      <TableHead className="font-medium">Attributes</TableHead>
                      <TableHead className="text-right font-medium">
                        Qty
                      </TableHead>
                      <TableHead className="text-right font-medium">
                        Price
                      </TableHead>
                      <TableHead className="text-right font-medium">
                        Total
                      </TableHead>
                      <TableHead className="text-right font-medium">
                        Refund Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
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
                            {/* (Optional) tiny ids line if you want:
                            <div className="text-[11px] text-muted-foreground">
                              {it.id}
                            </div> */}
                          </TableCell>
                          <TableCell className="align-top">
                            <AttrChips attrs={it.attrs} />
                          </TableCell>
                          <TableCell className="text-right align-top">
                            {it.quantity}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            {money(it.price, currencySymbol)}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            {money(it.total, currencySymbol)}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            {money(it.refundAmount, currencySymbol)}
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
                            <TableHead className="font-medium">Qty</TableHead>
                            <TableHead className="font-medium">
                              Amount
                            </TableHead>
                            <TableHead className="font-medium">
                              Reason
                            </TableHead>
                            <TableHead className="font-medium">By</TableHead>
                            <TableHead className="font-medium">At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {refundHistory.map((r) => (
                            <TableRow key={r._id}>
                              <TableCell>{r.refundQuantity}</TableCell>
                              <TableCell>
                                {money(r.refundAmount, currencySymbol)}
                              </TableCell>
                              <TableCell>{r.refundReason || '—'}</TableCell>
                              <TableCell>{r.refundedBy || '—'}</TableCell>
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


          {/* HISTORY */}
          <TabsContent value="history" className="mt-6">
            {history.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No history available
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Activity Timeline ({history.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {history.map((h, idx) => (
                      <div key={h._id || idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                          {idx < history.length - 1 && (
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
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> ID: {bill?._id || '—'}
              </span>
              <span>Updated: {fmtDate(updatedAt)}</span>
            </div>
           
            
          
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
