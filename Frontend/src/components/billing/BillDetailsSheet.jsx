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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Printer,
  User,
  FileText,
  Clock,
  RefreshCw,
  Calendar,
  ShoppingCart,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function fmtMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d || '');
  }
}

function fmtShortDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d || '');
  }
}

export default function BillDetailsSheet({
  open,
  onOpenChange,
  bill,
  onPrint,
  totalRefundQty,
  currencySymbol,
}) {
  const [activeTab, setActiveTab] = useState('items');

  const totals = useMemo(
    () => ({
      subtotal: Number(bill?.subtotal || 0),
      taxPercent: Number(bill?.taxPercent || 0),
      taxAmount: Number(bill?.taxAmount || 0),
      total: Number(bill?.total || 0),
    }),
    [bill]
  );

  const statusColor = (s) => {
    switch ((s || '').toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partially_refunded':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (s) => {
    switch ((s || '').toLowerCase()) {
      case 'paid':
        return '✓';
      case 'refunded':
        return <RefreshCw className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-6"
      >
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-xl">
                Bill Details
                {bill?.billNumber && (
                  <span className="text-muted-foreground text-sm font-normal bg-muted px-2 py-1 rounded">
                    #{bill.billNumber}
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4" />
                Created: {fmtDate(bill?.createdAt)}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${statusColor(
                  bill?.status
                )} border px-3 py-1 font-medium`}
              >
                <span className="mr-1">{getStatusIcon(bill?.status)}</span>
                {bill?.status ? bill.status.replace('_', ' ') : '—'}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Items
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6 mt-6">
            {/* Items Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Items ({bill?.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-medium">Item</TableHead>
                      <TableHead className="font-medium">SKU</TableHead>
                      <TableHead className="text-right font-medium">
                        Qty
                      </TableHead>
                      <TableHead className="text-right font-medium">
                        Price
                      </TableHead>
                      <TableHead className="text-right font-medium">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(bill?.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      bill.items.map((it, index) => (
                        <TableRow
                          key={it._id || `${it.sku}-${it.variantId}`}
                          className={
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                          }
                        >
                          <TableCell>
                            <div className="font-medium text-sm">
                              {it.itemName || 'Unnamed Item'}
                            </div>
                            {it.variantName && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {it.variantName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {it.sku || '—'}
                            </code>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {it.quantity ?? it.qty ?? 0}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {currencySymbol}
                            {it.price}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {currencySymbol}
                            {it.total}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {' '}
                      {currencySymbol}
                      {totals.subtotal}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({totals.taxPercent}%)
                    </span>
                    <span>
                      {' '}
                      {currencySymbol}
                      {totals.taxAmount}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {currencySymbol} {totals.total}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {bill?.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {bill.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Buyer Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4" />
                    Buyer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {bill?.buyer?.name || '—'}
                    </div>
                    {bill?.buyer?.email && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {bill.buyer.email}
                      </div>
                    )}
                    {bill?.buyer?.phone && (
                      <div className="text-sm text-muted-foreground">
                        {bill.buyer.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bill?.paymentMethod && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Method
                      </span>
                      <Badge
                        variant="outline"
                        className="capitalize font-normal"
                      >
                        {bill.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                  {bill?.paymentNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Reference
                      </span>
                      <span className="text-sm font-medium">
                        {bill.paymentNumber}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>Total Amount</span>
                      <span className="text-lg">
                        {' '}
                        {currencySymbol}
                        {totals.total}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Refund Information */}
            {bill?.refundDetails && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refund Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Refunded quantity
                    </span>
                    <span className="font-semibold text-amber-800">
                      {totalRefundQty}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Refunded
                    </span>
                    <span className="font-semibold text-amber-800">
                      {currencySymbol}
                      {bill.refundDetails.totalRefundAmount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Refunded At</span>
                    <span>{fmtDate(bill.refundDetails.refundedAt)}</span>
                  </div>

                  {bill.refundDetails.refundReason && (
                    <div className="pt-2 border-t border-amber-200">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reason: </span>
                        {bill.refundDetails.refundReason}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Refund History */}
            {bill?.refundHistory && bill.refundHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Refund History ({bill.refundHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-medium">Date</TableHead>
                        <TableHead className="text-right font-medium">
                          Amount
                        </TableHead>
                        <TableHead className="font-medium">Reason</TableHead>
                        <TableHead className="font-medium">By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bill.refundHistory.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell className="text-sm">
                            {fmtShortDate(r.refundedAt)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtMoney(r.refundAmount)}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div
                              className="text-sm truncate"
                              title={r.refundReason || ''}
                            >
                              {r.refundReason || '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.refundedBy || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6 mt-6">
            {/* History Timeline */}
            {bill?.history && bill.history.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    History Timeline ({bill.history.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bill.history.map((h, index) => (
                      <div key={h._id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                          {index < bill.history.length - 1 && (
                            <div className="w-px h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="font-medium text-sm capitalize">
                              {h.action?.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fmtShortDate(h.createdAt)}
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

        {/* Footer with Print Action */}
        <SheetFooter className="mt-6 pt-4 border-t">
          <div className="w-full flex justify-end">
            {onPrint && (
              <Button onClick={() => onPrint(bill)} className="gap-2 w-fit">
                <Printer className="w-4 h-4" />
                Print Bill
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
