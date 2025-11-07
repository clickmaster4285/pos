'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Info } from 'lucide-react';

/* ---------- helpers kept identical to Grid semantics ---------- */
const norm = (v) =>
  String(v || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

const currency = (n) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(n) ? n : 0);

const titleCase = (s = '—') =>
  s
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const shortOrder = (orderNumber, fallback) => {
  if (typeof orderNumber === 'string' && orderNumber.includes('-')) {
    const parts = orderNumber.split('-');
    return parts[parts.length - 1].toUpperCase();
  }
  return String(fallback || '')
    .slice(-6)
    .toUpperCase();
};

const isReturnFinal = (s) =>
  /(returned_(accept|accepted)|returned_(reject|rejected)|return(ed)?_(accepted|rejected)|accepted_return|rejected_return|return_denied)/.test(
    norm(s)
  );

const canCancel = (order) => {
  const payment = norm(order?.paymentStatus);
  const status = norm(order?.orderStatus || order?.status);
  return payment === 'unpaid' && ['pending', 'in_progress'].includes(status);
};

const getShipping = (o) => {
  const a =
    (o.shippingAddress && typeof o.shippingAddress === 'object'
      ? o.shippingAddress
      : null) ||
    o.shippingAddressSnapshot ||
    null;

  if (a) {
    const name = a.fullName || '—';
    const parts = [
      a.addressLine1,
      a.addressLine2,
      a.city,
      a.state,
      a.postalCode,
      a.country,
    ].filter(Boolean);
    return { name, addr: parts.join(', '), phone: a.phoneNumber || '—' };
  }
  if (typeof o.shippingAddress === 'string')
    return { name: '—', addr: o.shippingAddress, phone: '—' };
  if (o.shippingAddressId || o.addressId)
    return { name: '—', addr: 'Address not found', phone: '—' };
  return { name: '—', addr: '—', phone: '—' };
};

// same status derivation as grid
const computeOrderStatus = (o) => {
  const items = Array.isArray(o.items) ? o.items : [];
  if (!items.length) return 'pending';

  if (items.some((it) => norm(it.status) === 'returned_request'))
    return 'returned_request';
  if (items.some((it) => isReturnFinal(it.status))) {
    if (items.some((it) => /(accept|accepted)/.test(norm(it.status))))
      return 'returned_accept';
    if (items.some((it) => /(reject|rejected|denied)/.test(norm(it.status))))
      return 'returned_reject';
  }
  if (items.every((it) => norm(it.status) === 'delivered')) return 'delivered';
  if (items.some((it) => norm(it.status) === 'shipped')) return 'shipped';
  if (
    items.some((it) => ['processing', 'in_progress'].includes(norm(it.status)))
  )
    return 'processing';
  if (items.every((it) => norm(it.status) === 'cancelled')) return 'cancelled';
  if (items.some((it) => norm(it.status) === 'cancelled'))
    return 'partially_cancelled';
  return 'pending';
};

/* ---------- display blocks (mirrors Grid’s visible fields) ---------- */

function ItemsPreview({ items }) {
  const list = useMemo(
    () =>
      (Array.isArray(items) ? items : []).map((it) => ({
        id: it._id || it.id,
        name: it.productItem?.itemName || it.itemName || it.name || '—',
        sku: it.productItem?.sku || it.sku || '—',
        qty: it.quantity ?? it.qty ?? 1,
        price: it.price ?? 0,
        total:
          it.total ??
          Number(it.price ?? 0) * Number(it.quantity ?? it.qty ?? 1),
        dynamicAttributes: it.dynamicAttributes || {},
      })),
    [items]
  );

  const count = list.length;
  if (!count) return <span className="text-sm text-muted-foreground">—</span>;
  const first = list[0];
  const second = list[1];

  if (count <= 2) {
    return (
      <div className="space-y-2">
        {list.map((it) => (
          <div key={it.id || it.name} className="flex items-center gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{it.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Qty {it.qty} • Price {currency(it.price)}
              </p>
            </div>
            {Object.keys(it.dynamicAttributes || {}).length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 px-2">
                    <Info className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-3">
                  <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Item Attributes
                  </div>
                  <DynamicAttrsPills data={it.dynamicAttributes} />
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}
      </div>
    );
  }

  const remaining = count - 2;
  return (
    <div className="min-w-0">
      {[first, second].map((it) => (
        <div key={it.id || it.name} className="mb-2">
          <p className="text-sm font-medium truncate">{it.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            SKU: {it.sku} • Qty {it.qty} • Price {currency(it.price)}
          </p>
        </div>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="link" className="h-auto p-0 text-xs mt-1">
            +{remaining} more
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-96 p-4">
          <div className="mb-3 text-sm font-semibold">All Items ({count})</div>
          <div className="max-h-80 overflow-auto space-y-3 pr-1">
            {list.map((it) => (
              <div key={it.id || it.name} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{it.name}</p>
                  <p className="text-sm font-semibold">{currency(it.total)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Qty {it.qty} • Unit {currency(it.price)}
                </p>
                {Object.keys(it.dynamicAttributes || {}).length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <DynamicAttrsPills data={it.dynamicAttributes} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DynamicAttrsPills({ data }) {
  const filtered = { ...(data || {}) };
  delete filtered.tableNo;
  delete filtered.waiterId;

  const entries = Object.entries(filtered).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
  );

  if (!entries.length)
    return <span className="text-sm text-muted-foreground">—</span>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="text-sm">
          <span className="font-medium">{titleCase(k)}:</span>{' '}
          <span className="opacity-90">
            {typeof v === 'string' || typeof v === 'number'
              ? String(v)
              : JSON.stringify(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* =================== TABLE (mirrors Grid fields) =================== */

export function OrdersTable({
  orders,
  onEdit, // (order, 'cancelled')
  onDelete, // kept for compatibility
  loadingIds,
  onRequestReturn,
  onHandleReturnRequest, // (order, 'accept' | 'reject')
  onRowClick,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [acting, setActing] = useState(false);

  if (!orders?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">No orders found.</p>
    );
  }

  const runReturnAction = async (order, action) => {
    try {
      setActing(true);
      await onHandleReturnRequest?.(order, action);
      setDialogText(
        action === 'accept'
          ? 'Return request accepted.'
          : 'Return request rejected.'
      );
    } catch (e) {
      setDialogText('Failed to process return request.');
    } finally {
      setActing(false);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Card className="border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 items-center px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
          <div className="col-span-1">Order</div>
          <div className="col-span-2">Customer / Table / Waiter</div>
          <div className="col-span-3">Items</div>
          <div className="col-span-2">Payment</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-center">Created</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        {orders.map((o) => {
          const id = o._id || o.id;
          const totalStr =
            typeof o.subTotal === 'number'
              ? currency(o.subTotal)
              : typeof o.totalAmount === 'number'
              ? currency(o.totalAmount)
              : o.subTotal || o.totalAmount || '—';

          const items = Array.isArray(o.items) ? o.items : [];
          const hasDeliveredItems = items.some(
            (it) => norm(it.status) === 'delivered'
          );
          const hasPendingReturn = items.some(
            (it) => norm(it.status) === 'returned_request'
          );
          const isAllDelivered =
            items.length > 0 &&
            items.every((it) => norm(it.status) === 'delivered');

          const orderStatus = computeOrderStatus(o);
          const paymentStatus = titleCase(o.paymentStatus || '—');
          const orderType =
            o?.dynamicAttributes?.orderType || o.orderType || o.type || '—';

          const finalizedByItems = items.some((it) => isReturnFinal(it.status));
          const finalizedByOrder = isReturnFinal(orderStatus);
          const hideKebab = finalizedByItems || finalizedByOrder;

          return (
            <div
              key={id || o.orderNumber || o.orderNo}
              className="grid grid-cols-12 items-center px-5 py-4 text-sm border-b last:border-0 hover:bg-accent/30 transition-colors"
            >
              {/* Order */}
              <div
                className="col-span-1 min-w-0 cursor-pointer"
                onClick={() => onRowClick?.(o)}
              >
                <p className="font-semibold truncate">
                  #{shortOrder(o.orderNumber || o.orderNo, id)}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {o.orderNumber || o.orderNo || id}
                </p>
              </div>

              {/* Customer / Table / Waiter */}
              <div
                className="col-span-2 min-w-0 cursor-pointer space-y-0.5"
                onClick={() => onRowClick?.(o)}
              >
                <p className="font-medium truncate">
                  {o.customerName || o.userName || o.user?.name || 'Guest'}
                </p>
                {o.dynamicAttributes?.tableName && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Table: {o.dynamicAttributes.tableName}
                  </p>
                )}
                {o.dynamicAttributes?.waiterName && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Waiter: {o.dynamicAttributes.waiterName}
                  </p>
                )}
                {orderType && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Type: {titleCase(orderType)}
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="col-span-3 min-w-0">
                <ItemsPreview items={o.items} />
              </div>

              {/* Payment */}
              <div className="col-span-2 min-w-0 space-y-1">
                <p className="font-medium truncate">{totalStr}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Method: {titleCase(o.paymentMethod || '—')}
                </p>
                <Badge variant="secondary" className="capitalize mt-1">
                  {paymentStatus}
                </Badge>
              </div>

              {/* Status */}
              <div className="col-span-2 min-w-0 flex flex-col gap-1">
                <Badge variant="secondary" className="capitalize w-fit">
                  {titleCase(orderStatus)}
                </Badge>
              </div>

              {/* Created */}
              <div className="col-span-1 text-center text-xs text-muted-foreground truncate">
                {o.createdAt ? format(new Date(o.createdAt), 'PPp') : '—'}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end">
                {!hideKebab && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-accent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    {hasPendingReturn ? (
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Return</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => runReturnAction(o, 'accept')}
                          disabled={acting}
                        >
                          Accept Return Request
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => runReturnAction(o, 'reject')}
                          disabled={acting}
                        >
                          Reject Return Request
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    ) : (
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {!isAllDelivered && canCancel(o) && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onEdit?.(o, 'cancelled')}
                            disabled={!!loadingIds?.has(String(id))}
                          >
                            Cancel Order
                          </DropdownMenuItem>
                        )}

                        {hasDeliveredItems && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onRequestReturn?.(o)}
                            >
                              Request Return
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Result dialog for accept/reject */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Request</DialogTitle>
            <DialogDescription>{dialogText}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end">
            <Button onClick={() => setDialogOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
