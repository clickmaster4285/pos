'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
  Package,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  MoreVertical,
  Hash,
  DollarSign,
  Tag,
  Pen,
  Box, // lucide-react
} from 'lucide-react';

const safe = (v) => (typeof v === 'string' ? v : '');
const getId = (v) => v?.id ?? v?._id ?? '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function currency(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(n ?? 0);
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

function titleCase(s = '—') {
  return s
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function latestHistoryAction(o = {}) {
  const arr = Array.isArray(o.history)
    ? o.history.filter((h) => typeof h?.action === 'string')
    : [];
  if (!arr.length) return null;

  const dated = arr.filter(
    (h) => h?.createdAt && !Number.isNaN(new Date(h.createdAt).getTime())
  );
  if (dated.length) {
    dated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return dated.at(-1).action || null;
  }
  return arr.at(-1).action || null;
}

function InfoStat({ label, icon: Icon, children }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
        {Icon ? (
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : null}
        <span className="truncate">{children}</span>
      </div>
    </div>
  );
}

function ItemsBlock({ items }) {
  const list = Array.isArray(items)
    ? items.map((it) => ({
        id: it._id || it.id,
        name: it.inventoryItem?.itemName || it.itemName || '—',
        sku: it.inventoryItem?.sku || it.sku || '—',
        qty: it.quantity ?? 1,
        price: it.price ?? 0,
        total: it.total ?? (it.price ?? 0) * (it.quantity ?? 1),
      }))
    : [];

  const count = list.length;

  const Item = ({ it }) => (
    <div className="min-w-0 mb-2 flex items-center gap-2">
      <Box className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-sm truncate">{it.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          SKU: {it.sku} • Qty {it.qty}
        </p>
      </div>
    </div>
  );

  if (count === 0)
    return <span className="text-sm text-muted-foreground">—</span>;
  if (count === 1) return <Item it={list[0]} />;
  if (count === 2)
    return (
      <div className="min-w-0">
        <Item it={list[0]} />
        <Item it={list[1]} />
      </div>
    );

  const remaining = count - 2;

  return (
    <div className="min-w-0">
      <Item it={list[0]} />
      <Item it={list[1]} />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-xs mt-1 underline underline-offset-2"
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
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
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
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function OrdersGrid({
  orders,
  onEdit, // update status (kept for non-return state)
  onDelete, // cancel items (kept for non-return state)
  onView,
  onRequestReturn,
  loadingIds,
  onHandleReturnRequest, // used for accept/reject
  renderAddress,
  onCardClick,
  addressesLoading,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [acting, setActing] = useState(false);

  if (!orders?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">No orders found.</p>
    );
  }

  // helper to show result dialog after accept/reject
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 mb-8 auto-rows-[1fr]">
        {orders.map((o) => {
          const id = getId(o);
          const short = shortOrder(o.orderNumber, id);

          // Build shipping lines (name, full address, phone)
          const shipping = (() => {
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
          })();

          const totalStr =
            typeof o.totalAmount === 'number'
              ? currency(o.totalAmount)
              : o.totalAmount || '—';

          const paymentMethod = titleCase(o.paymentMethod || '—');
          const orderType = titleCase(o.orderType || '—');

          const latest = (latestHistoryAction(o) || '').toLowerCase();
          const isReturnRequested = /return\s+request/.test(latest);
          const items = Array.isArray(o.items) ? o.items : [];
          const deliveredIds = items
            .filter((it) => String(it.status || '') === 'delivered')
            .map((it) => it._id || it.id);

          const hasDeliveredItems = deliveredIds.length > 0; // ✅ only then allow "Request Return"
          const hasPendingReturn = items.some(
            (it) => String(it.status || '') === 'returned_request'
          );
          const isAllDelivered =
            items.length > 0 &&
            items.every((it) => String(it.status || '') === 'delivered');

          const norm = (v) =>
            String(v || '')
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '_');
          const isAcceptedStatus = (s) =>
            /(return(ed)?_accepted|accepted_return)/.test(norm(s));
          const isRejectedStatus = (s) =>
            /(return(ed)?_rejected|rejected_return|return_denied)/.test(
              norm(s)
            );
          // pending / delivered as you had

          // 👇 more robust finalization checks (items + history)
          const anyAccepted = items.some((it) => isAcceptedStatus(it.status));
          const anyRejected = items.some((it) => isRejectedStatus(it.status));

          const latestRecord = norm(latestHistoryAction(o) || '');
          const finalizedByHistory =
            /(return(ed)?_accepted|accepted_return|return(ed)?_rejected|rejected_return|return_denied)/.test(
              latestRecord
            );

          // HIDE menu if any item finalized OR history says finalized
          const hideKebab = anyAccepted || anyRejected || finalizedByHistory;
          // (you can keep your existing hasPendingReturn / isAllDelivered, etc.)

          return (
            <Card
              key={id || o.orderNumber}
              className="group relative overflow-hidden border-border bg-card p-4 rounded-2xl transition hover:shadow-lg h-full flex flex-col min-h-[300px]"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"
                  onClick={() => onCardClick?.(o)}
                >
                  <Package className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-md text-foreground truncate">
                        {safe(o.userName) ||
                          safe(o.user?.name) ||
                          safe(o.userId) ||
                          '—'}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        <span className="truncate">#{short}</span>
                        {/* <span className="opacity-50">•</span> */}
                        {/* <span className="truncate">{safe(o.companyId)}</span> */}
                      </p>
                    </div>

                    {!hideKebab && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2 opacity-80 hover:opacity-100"
                            aria-label="Open actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        {/* If a return is requested, ONLY show accept/reject */}
                        {hasPendingReturn ? (
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Return</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => runReturnAction(o, 'accept')}
                            >
                              Accept Return Request
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => runReturnAction(o, 'reject')}
                            >
                              Reject Return Request
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        ) : (
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* your existing rules: hide update/cancel when fully delivered */}
                            {!isAllDelivered && (
                              <DropdownMenuItem onClick={() => onEdit?.(o)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Update Order Status
                              </DropdownMenuItem>
                            )}
                            {!isAllDelivered && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete?.(o)}
                                disabled={!!loadingIds?.has(getId(o) || o._id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel Order Items
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* ✅ Only show "Request Return" if there is at least one delivered item */}
                            {hasDeliveredItems && (
                              <DropdownMenuItem
                                onClick={() => onRequestReturn?.(o)}
                              >
                                Request Return
                              </DropdownMenuItem>
                            )}
                            {/* If nothing delivered, show nothing here */}
                          </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div
                className="space-y-4 mt-4 flex-1 min-h-0"
                onClick={() => onCardClick?.(o)}
              >
                <InfoStat label="Order Number">{o.orderNumber || '—'}</InfoStat>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Shipping
                  </p>
                  <div className="mt-1 text-sm text-foreground min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">
                        {shipping.name}
                      </span>
                    </div>
                    <div
                      className="pl-5 mt-1 whitespace-normal break-words leading-relaxed"
                      title={shipping.addr}
                    >
                      {shipping.addr}
                    </div>
                    <div className="pl-5 mt-1 text-muted-foreground">
                      {shipping.phone}
                    </div>
                  </div>
                </div>

                <div className="min-h-[72px]">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Items {Array.isArray(o.items) ? `(${o.items.length})` : ''}
                  </p>
                  <div className="mt-1 min-w-0">
                    <ItemsBlock items={o.items} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoStat label="Total Amount" icon={DollarSign}>
                    {totalStr}
                  </InfoStat>
                  <InfoStat label="Payment Method" icon={Tag}>
                    {paymentMethod}
                  </InfoStat>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoStat label="Payment Status" icon={Tag}>
                    {titleCase(o.paymentStatus || '—')}
                  </InfoStat>
                  <InfoStat label="Order Type">{orderType}</InfoStat>
                </div>

                <InfoStat label="Notes" icon={Pen}>
                  {o.notes || '—'}
                </InfoStat>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="secondary"
                    className="h-6 px-2 text-xs max-w-[260px] truncate"
                    title={latestHistoryAction(o) || ''}
                  >
                    {latestHistoryAction(o) || '—'}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {fmtDate(o.createdAt)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Result dialog after accept/reject */}
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
