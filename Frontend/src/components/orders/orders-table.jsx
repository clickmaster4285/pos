'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { MoreVertical } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { Badge } from '../ui/badge';

function currency(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(n ?? 0);
}

function titleCase(s = '—') {
  return s
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function shortOrder(orderNumber, fallback) {
  if (typeof orderNumber === 'string' && orderNumber.includes('-')) {
    const parts = orderNumber.split('-');
    return parts[parts.length - 1].toUpperCase();
  }
  return String(fallback || '')
    .slice(-6)
    .toUpperCase();
}

function normalizeItem(it) {
  return {
    id: it._id || it.id,
    name: it.inventoryItem?.itemName || it.itemName || '—',
    sku: it.inventoryItem?.sku || it.sku || '—',
    qty: it.quantity ?? 1,
    price: it.price ?? 0,
    total: it.total ?? (it.price ?? 0) * (it.quantity ?? 1),
  };
}

function ItemsPreview({ items }) {
  const list = useMemo(
    () => (Array.isArray(items) ? items.map(normalizeItem) : []),
    [items]
  );
  const count = list.length;

  if (count === 0) return <p className="text-sm text-muted-foreground">—</p>;

  if (count === 1) {
    const a = list[0];
    return (
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm truncate">{a.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          SKU: {a.sku} • Qty {a.qty}
        </p>
      </div>
    );
  }

  if (count === 2) {
    const a = list[0],
      b = list[1];
    return (
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm truncate">{a.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          SKU: {a.sku} • Qty {a.qty}
        </p>
        <p className="text-sm truncate">{b.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          SKU: {b.sku} • Qty {b.qty}
        </p>
      </div>
    );
  }

  const a = list[0],
    b = list[1];
  const remaining = count - 2;

  return (
    <div className="min-w-0">
      <p className="text-sm truncate">{a.name}</p>
      <p className="text-[11px] text-muted-foreground truncate">
        SKU: {a.sku} • Qty {a.qty}
      </p>

      <p className="text-sm truncate">{b.name}</p>
      <p className="text-[11px] text-muted-foreground truncate">
        SKU: {b.sku} • Qty {b.qty}
      </p>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-xs mt-1"
            title="Show all items"
          >
            +{remaining} more
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-80 p-3">
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            All items ({count})
          </div>
          <div className="max-h-72 overflow-auto space-y-2 pr-1">
            {list.map((it) => (
              <div
                key={it.id || `${it.name}-${it.sku}`}
                className="rounded-md border p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{it.name}</p>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {currency(it.total)}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  SKU: {it.sku} • Qty {it.qty} • Price {currency(it.price)}
                </p>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function getShipping(o) {
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
    const addr = parts.join(', ');
    const phone = a.phoneNumber || '—';
    return { name, addr, phone };
  }

  if (typeof o.shippingAddress === 'string') {
    return { name: '—', addr: o.shippingAddress, phone: '—' };
  }

  if (o.shippingAddressId || o.addressId) {
    return { name: '—', addr: 'Address not found', phone: '—' };
  }

  return { name: '—', addr: '—', phone: '—' };
}

// Derive an overall order status from item statuses
function computeOrderStatus(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  if (!items.length) return 'pending';

  if (items.some((it) => String(it.status) === 'returned_request'))
    return 'returned_request';
  if (items.some((it) => String(it.status) === 'returned_accept'))
    return 'returned_accept';
  if (items.some((it) => String(it.status) === 'returned_reject'))
    return 'returned_reject';

  if (items.every((it) => String(it.status) === 'delivered'))
    return 'delivered';
  if (items.some((it) => String(it.status) === 'shipped')) return 'shipped';
  if (
    items.some((it) =>
      ['processing', 'in_progress'].includes(String(it.status))
    )
  )
    return 'processing';

  if (items.every((it) => String(it.status) === 'cancelled'))
    return 'cancelled';
  if (items.some((it) => String(it.status) === 'cancelled'))
    return 'partially_cancelled';

  return 'pending';
}

export function OrdersTable({
  orders,
  onEdit, // update status
  onDelete, // cancel items
  loadingIds,
  onRequestReturn, // request return
  onHandleReturnRequest, // accept/reject return
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
      setDialogText(
        e?.data?.message || e?.message || 'Failed to process return request.'
      );
    } finally {
      setActing(false);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Card className="divide-y border-border">
        {/* Header */}
        <div className="grid grid-cols-12 items-center px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-1">Order</div>
          <div className="col-span-1">Customer</div>
          <div className="col-span-3">Shipping</div>
          <div className="col-span-2">Items</div>
          <div className="col-span-2">Payment</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Created</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        {orders.map((o) => {
          const id = o._id || o.id;
          const shipping = getShipping(o);
          const amount = currency(o.totalAmount);
          const method = titleCase(o.paymentMethod || '—');
          const paymentStatus = titleCase(o.paymentStatus || '—');
          const orderType = titleCase(o.orderType || '—');

          const items = Array.isArray(o.items) ? o.items : [];
          const deliveredIds = items
            .filter((it) => String(it.status || '') === 'delivered')
            .map((it) => it._id || it.id);

          const hasDeliveredItems = deliveredIds.length > 0;
          const hasPendingReturn = items.some(
            (it) => String(it.status || '') === 'returned_request'
          );
          const isAllDelivered =
            items.length > 0 &&
            items.every((it) => String(it.status || '') === 'delivered');

          const orderStatus = computeOrderStatus(o);
          // Normalize status strings like "Return Accepted", "returned_accept" → "returned_accept"
          const norm = (v) =>
            String(v || '')
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '_');

          // Treat both variants as final: returned_accept/returned_accepted and returned_reject/returned_rejected
          const isReturnFinal = (s) =>
            /(returned_(accept|accepted)|returned_(reject|rejected))/.test(
              norm(s)
            );

          // finalization checks
          const finalizedByItems = items.some((it) => isReturnFinal(it.status));
          const finalizedByOrder = isReturnFinal(orderStatus);

          // hide kebab if finalized
          const hideKebab = finalizedByItems || finalizedByOrder;

          return (
            <div
              key={id || o.orderNumber}
              className="grid grid-cols-12 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
            >
              {/* Order */}
              <div
                className="col-span-1 min-w-0 pr-2"
                onClick={() => onRowClick?.(o)}
              >
                <p className="text-sm font-medium truncate">
                  {shortOrder(o.orderNumber, id)}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {o.orderNumber || id}
                </p>
              </div>

              {/* Customer */}
              <div
                className="col-span-1 min-w-0 pr-2"
                onClick={() => onRowClick?.(o)}
              >
                <p className="text-sm truncate">
                  {o.userName || o.user?.name || o.userId || '—'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {o.companyId}
                </p>
              </div>

              {/* Shipping */}
              <div
                className="col-span-3 min-w-0 pr-3"
                onClick={() => onRowClick?.(o)}
              >
                <p className="text-sm font-medium truncate">{shipping.name}</p>
                <p
                  className="text-[11px] text-muted-foreground truncate"
                  title={shipping.addr}
                >
                  {shipping.addr}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {shipping.phone}
                </p>
              </div>

              {/* Items */}
              <div className="col-span-2 min-w-0 pr-2">
                <ItemsPreview items={o.items} />
              </div>

              {/* Payment */}
              <div className="col-span-2 min-w-0 pr-2">
                <p className="text-sm truncate">{amount}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {method}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                  <span className="truncate">
                    Payment Status: {paymentStatus}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Order Type: {orderType}
                </p>
              </div>

              {/* Status */}
              <div className="col-span-1 min-w-0 pr-2">
                <Badge variant={'secondary'}>{orderStatus}</Badge>
              </div>

              {/* Created */}
              <div className="col-span-1 min-w-0 pr-2">
                <p className="text-xs text-muted-foreground truncate">
                  {o.createdAt ? format(new Date(o.createdAt), 'PPp') : '—'}
                </p>
              </div>

              {/* Actions: ONLY 3-dot menu */}
              <div className="col-span-1 flex items-center justify-end">
                {!hideKebab && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-accent"
                        aria-label="More actions"
                        title="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    {/* If a return is pending: ONLY Accept/Reject */}
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

                        {/* Hide update/cancel when fully delivered */}
                        {!isAllDelivered && (
                          <DropdownMenuItem onClick={() => onEdit?.(o)}>
                            Update Order Status
                          </DropdownMenuItem>
                        )}
                        {!isAllDelivered && (
                          <DropdownMenuItem
                            onClick={() => onDelete?.(o)}
                            disabled={!!loadingIds?.has(id)}
                            className="text-destructive focus:text-destructive"
                          >
                            Cancel Order Items
                          </DropdownMenuItem>
                        )}

                        {/* Request Return only if any delivered item exists */}
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
