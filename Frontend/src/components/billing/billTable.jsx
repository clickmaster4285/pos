'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Search,
  MoreVertical,
  Plus,
  Trash2,
  Filter as FilterIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// helpers
const num = (v) => Number(v || 0);

const getRefundedAmount = (bill = {}) => {
  const topLevel =
    num(bill.totalRefundAmount) || num(bill?.refundDetails?.totalRefundAmount);

  if (topLevel) return topLevel;

  const items = Array.isArray(bill.items) ? bill.items : [];
  return items.reduce((sum, item) => {
    if (item && item.refundAmount != null) return sum + num(item.refundAmount);
    const hist = Array.isArray(item?.refundHistory) ? item.refundHistory : [];
    const histSum = hist.reduce((s, r) => s + num(r.refundAmount), 0);
    return sum + histSum;
  }, 0);
};

function StatusBadge({ status }) {
  const map = {
    paid: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    partially_refunded: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    refunded: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    pending: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.color} capitalize`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}

export function BillRow({
  bill,
  expanded,
  onToggleExpand,
  onEdit,
  onPrint,
  onDelete,
  onView,
  updatePermission,
  deletePermission,
  currencySymbol,
}) {
  const refundedAmount = useMemo(() => getRefundedAmount(bill), [bill]);
  const netTotal = useMemo(
    () => Math.max(0, num(bill.total) - refundedAmount),
    [bill, refundedAmount]
  );

  return (
    <>
      <TableRow className="border-border hover:bg-muted/50">
        <TableCell
          className="font-medium text-card-foreground"
          onClick={() => onView(bill)}
        >
          {bill.billNumber}
        </TableCell>

        <TableCell onClick={() => onView(bill)}>
          <div className="flex flex-col">
            <span className="font-medium text-card-foreground">
              {bill?.buyer?.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {bill?.buyer?.email}
            </span>
          </div>
        </TableCell>

        <TableCell onClick={() => onView(bill)}>
          <div className="flex flex-col gap-1">
            {(bill.items || []).slice(0, 2).map((item, i) => (
              <div key={i} className="text-sm text-card-foreground">
                {item.quantity}x {item.itemName} ({item.variantName})
              </div>
            ))}
            {(bill.items || []).length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{(bill.items || []).length - 2} more items
              </div>
            )}
          </div>
        </TableCell>

        {/* Net total in the main row */}
        <TableCell
          className="text-right font-semibold text-card-foreground"
          onClick={() => onView(bill)}
        >
          {currencySymbol}
          {netTotal.toFixed(2)}
        </TableCell>

        <TableCell onClick={() => onView(bill)}>
          <StatusBadge status={bill.status} />
        </TableCell>

        <TableCell className="text-sm text-muted-foreground">
          {new Date(bill.createdAt).toLocaleDateString()}
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="h-8 w-8"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="bg-popover border-border"
              >
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-popover-foreground hover:bg-accent">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Refund
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    <DropdownMenuItem
                      onClick={() => onEdit(bill, 'partial')}
                      disabled={!updatePermission || bill.status === 'refunded'}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      Partial Refund
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!updatePermission || bill.status === 'refunded'}
                      onClick={() => onEdit(bill, 'full')}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      Full Refund
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  className="text-popover-foreground hover:bg-accent"
                  onClick={() => onPrint(bill)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </DropdownMenuItem>

                <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={!deletePermission}
                  className="text-red-600 hover:bg-accent hover:text-red-700"
                  onClick={() => onDelete(bill._id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-card-foreground mb-3">
                  Bill Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {num(bill.subtotal).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax ({bill.taxPercent}%)
                    </span>
                    <span className="font-medium">
                      {currencySymbol}
                      {num(bill.taxAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {num(bill.total).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refunded:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {refundedAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground font-medium">
                      Net Total:
                    </span>
                    <span className="font-bold text-lg">
                      {currencySymbol}
                      {netTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {bill.notes && (
                  <div className="mt-4">
                    <h5 className="font-medium text-card-foreground mb-1">
                      Notes
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {bill.notes}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-card-foreground mb-3">
                  Items
                </h4>
                <div className="space-y-2">
                  {(bill.items || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 bg-background rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variantName} · {item.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {item.quantity} × {currencySymbol}
                          {num(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
