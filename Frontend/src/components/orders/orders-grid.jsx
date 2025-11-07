'use client';

import { useMemo, useState } from 'react';
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
  Calendar,
  MoreVertical,
  Hash,
  DollarSign,
  Tag,
  Edit,
  Trash2,
  Pen,
  Box,
  Info,
  Clock,
  Package,
  User,
  Phone,
  Utensils,
  Users,
  CreditCard,
} from 'lucide-react';

// ✅ import your industry helpers (update the path if yours is different)
import { getIndustryFields } from '@/utils/orderFields';

const safe = (v) => (typeof v === 'string' ? v : '');
const getId = (v) => v?.id ?? v?._id ?? '';

const fmtDateTime = (d, locale) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return new Intl.DateTimeFormat(locale || undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dt);
};

const timeAgo = (d) => {
  if (!d) return '—';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m ago` : `${h}h ago`;
};

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

function InfoStat({ label, icon: Icon, children, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-2 text-sm text-foreground min-w-0">
        {Icon ? (
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : null}
        <span className="truncate font-medium">{children}</span>
      </div>
    </div>
  );
}

/** Show a compact list of key: value pills for dynamic attributes */
function DynamicAttrsPills({ data }) {
  const filteredData = { ...data };
  delete filteredData.tableNo;
  delete filteredData.waiterId;

  const entries = Object.entries(filteredData || {}).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
  );

  if (!entries.length) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {entries.map(([k, v]) => (
        <div key={k} title={`${k}: ${v}`} className="text-sm">
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

/** Respect industry-specific field ordering when possible */
function DynamicAttrsSection({ industry, data, label = 'Order Details' }) {
  const fields = useMemo(() => getIndustryFields(industry), [industry]);

  const filteredData = { ...data };
  delete filteredData.tableNo;
  delete filteredData.waiterId;

  const keysInOrder =
    fields.length > 0
      ? [
          ...fields.map((f) => f.name),
          ...Object.keys(filteredData || {}).filter(
            (k) => !fields.some((f) => f.name === k)
          ),
        ]
      : Object.keys(filteredData || {});

  const ordered = filteredData || {};
  const display = keysInOrder
    .filter((k) => ordered[k] !== undefined && ordered[k] !== null)
    .reduce((acc, k) => {
      acc[k] = ordered[k];
      return acc;
    }, {});

  return (
    <div>
      <InfoStat label={label} />
      <div className="mt-2">
        <DynamicAttrsPills data={display} />
      </div>
    </div>
  );
}

function ItemsBlock({ items, onCardClick }) {
  const list = Array.isArray(items)
    ? items.map((it) => ({
        id: it._id || it.id,
        name: it.name || '—',
        qty: it.qty ?? 1,
        price: it.price ?? 0,
        total: it.total ?? (it.price ?? 0) * (it.qty ?? 1),
        dynamicAttributes: it.dynamicAttributes || {},
      }))
    : [];

  const count = list.length;

  const Item = ({ it }) => (
    <div className="min-w-0 mb-3 p-2 rounded-lg border bg-secondary-foreground/40">
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 " />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-gray-900">
            {it.name}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>Qty: {it.qty}</span>
            <span>•</span>
            <span>Price: {currency(it.price)}</span>
            <span>•</span>
            <span className="font-medium text-primary ">
              Total: {currency(it.total)}
            </span>
          </div>
        </div>

        {Object.keys(it.dynamicAttributes || {}).length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs "
                title="View item attributes"
              >
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
    </div>
  );

  if (count === 0)
    return <span className="text-sm text-muted-foreground">—</span>;
  if (count <= 2)
    return list.map((it) => <Item key={it.id || it.name} it={it} />);

  const remaining = count - 2;

  return (
    <div className="min-w-0">
      {list.slice(0, 2).map((it) => (
        <Item key={it.id || it.name} it={it} />
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-xs mt-1 text-primary/60 hover:text-primary/80"
            title="Show all items"
          >
            +{remaining} more items
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-96 p-4">
          <div className="mb-3 text-sm font-semibold text-gray-900">
            All Items ({count})
          </div>
          <div className="max-h-80 overflow-auto space-y-3 pr-1">
            {list.map((it) => (
              <div
                key={it.id || it.name}
                className="rounded-lg border border-gray-200 p-3 bg-white"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium truncate text-gray-900">
                    {it.name}
                  </p>
                  <p className="text-sm font-semibold text-primary/60 shrink-0">
                    {currency(it.total)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span>Qty: {it.qty}</span>
                  <span>•</span>
                  <span>Unit Price: {currency(it.price)}</span>
                </div>
                {Object.keys(it.dynamicAttributes || {}).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
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

function StatusBadge({ status, paymentStatus }) {
  const getStatusVariant = (status) => {
    const statusMap = {
      pending: 'secondary',
      cooking: 'default',
      ready: 'active',
      completed: 'default',
      cancelled: 'destructive',
    };
    return statusMap[status] || 'secondary';
  };

  const getPaymentVariant = (status) => {
    const paymentMap = {
      paid: 'default',
      unpaid: 'destructive',
      pending: 'secondary',
      refunded: 'secondary',
    };
    return paymentMap[status] || 'secondary';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={getStatusVariant(status)}
        className="capitalize px-2 py-1 text-xs font-medium"
      >
        {titleCase(status)}
      </Badge>
      <Badge
        variant={getPaymentVariant(paymentStatus)}
        className="capitalize px-2 py-1 text-xs font-medium"
      >
        {titleCase(paymentStatus)}
      </Badge>
    </div>
  );
}

export function OrdersGrid({
  orders,
  onEdit,
  onDelete,
  onRequestReturn,
  loadingIds,
  onHandleReturnRequest,
  onCardClick,
  industry = 'Pharmacy',
  isChef,
  isAdmin,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogText, setDialogText] = useState('');

  if (!orders?.length) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">No orders found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Orders will appear here once created
        </p>
      </div>
    );
  }

  const runReturnAction = async (order, action) => {
    try {
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
      setDialogOpen(true);
    }
  };

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_');
  }

  function getStatus(order) {
    return norm(order?.orderStatus || order?.status || '');
  }

  function getPaymentStatus(order) {
    return norm(order?.paymentStatus);
  }

  const normStr = (v) =>
    String(v || '')
      .toLowerCase()
      .trim()
      .replace(/\s/g, '_');

  const isItemCancelled = (it) => {
    const s = normStr(it?.status);
    return s === 'cancelled' || s === 'canceled' || it?.isCancelled === true;
  };

  // Return the item IDs that are cancellable under the role rule:
  // - Admin: any item that is NOT already cancelled
  // - Staff: only items with status 'pending'
  function getCancellableItemIds(order) {
    const items = Array.isArray(order?.items) ? order.items : [];
    return items
      .filter((it) => {
        if (isItemCancelled(it)) return false;
        if (isAdmin) return true;
        return normStr(it?.status) === 'pending';
      })
      .map((it) => it._id || it.id)
      .filter(Boolean);
  }

  function hasAnythingToCancel(order) {
    return getCancellableItemIds(order).length > 0;
  }

  function getOrderType(order) {
    const t =
      order?.dynamicAttributes?.orderType ||
      order?.orderType ||
      order?.type ||
      '';
    return norm(t);
  }

  function getNextAction(order) {
    const status = getStatus(order);
    const type = getOrderType(order);

    if (!status || status === 'pending' || status === 'in_progress') {
      return { label: 'Start Cooking', nextStatus: 'cooking' };
    }

    if (status === 'cooking') {
      return { label: 'Mark Ready', nextStatus: 'ready' };
    }

    if (status === 'ready') {
      const isDineIn = [
        'dine_in',
        'dine-in',
        'dinein',
        'dine',
        'restaurant',
      ].includes(type);
      if (isDineIn) {
        return { label: 'Collected by Waiter', nextStatus: 'collected' };
      }
      return { label: 'Hand to Rider', nextStatus: 'handed_over' };
    }

    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
        {orders.map((o) => {
          const id = getId(o);
          const short = shortOrder(o.orderNumber || o.orderNo, id);
          const totalStr =
            typeof o.subTotal === 'number'
              ? currency(o.subTotal)
              : typeof o.totalAmount === 'number'
              ? currency(o.totalAmount)
              : o.subTotal || o.totalAmount || '—';

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

          const anyAccepted = items.some((it) => isAcceptedStatus(it.status));
          const anyRejected = items.some((it) => isRejectedStatus(it.status));
          const latestRecord = norm(latestHistoryAction(o) || '');
          const finalizedByHistory =
            /(return(ed)?_accepted|accepted_return|return(ed)?_rejected|rejected_return|return_denied)/.test(
              latestRecord
            );

          const hideKebab = anyAccepted || anyRejected || finalizedByHistory;
          const action = getNextAction(o);

          return (
            <Card
              key={id || o.orderNumber || o.orderNo}
              className="group relative overflow-hidden border border-gray-200 bg-white p-5 rounded-xl transition-all hover:shadow-md hover:border-gray-300 h-full flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-xl bg-primary text-white grid place-items-center shrink-0 shadow-sm"
                    onClick={() => onCardClick?.(o)}
                  >
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      Order #{short}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {fmtDateTime(o.createdAt)}
                    </p>
                  </div>
                </div>

                {!hideKebab && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-gray-100"
                        aria-label="Open actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    {hasPendingReturn ? (
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Return Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => runReturnAction(o, 'accept')}
                        >
                          Accept Return
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => runReturnAction(o, 'reject')}
                        >
                          Reject Return
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    ) : (
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* {!isAllDelivered && (
                          <DropdownMenuItem onClick={() => onEdit?.(o)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                        )} */}
                        {hasAnythingToCancel(o) && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete?.(o)}
                            disabled={!!loadingIds?.has(getId(o) || o._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isAdmin
                              ? 'Cancel Items'
                              : 'Cancel Pending Items'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {hasDeliveredItems && (
                          <DropdownMenuItem
                            onClick={() => onRequestReturn?.(o)}
                          >
                            Request Return
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
                )}
              </div>

              {/* Customer & Service Info */}
              <div className="grid grid-cols-2 gap-4 ">
                <InfoStat label="Customer" icon={User}>
                  {safe(o.customerName) ||
                    safe(o.userName) ||
                    safe(o.user?.name) ||
                    'Guest'}
                </InfoStat>

                {o.dynamicAttributes?.tableName && (
                  <InfoStat label="Table" icon={Utensils}>
                    {o.dynamicAttributes.tableName}
                  </InfoStat>
                )}

                {o.dynamicAttributes?.waiterName && (
                  <InfoStat label="Waiter" icon={Users}>
                    {o.dynamicAttributes.waiterName}
                  </InfoStat>
                )}

                {o.dynamicAttributes?.orderType && (
                  <InfoStat label="Order Type" icon={Tag}>
                    {titleCase(o.dynamicAttributes.orderType)}
                  </InfoStat>
                )}
              </div>

              {/* Items Section */}
              <div className=" flex-1">
                <div
                  className="flex items-center justify-between mb-2"
                  onClick={() => onCardClick?.(o)}
                >
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Items {items.length ? `(${items.length})` : ''}
                  </p>
                  <span className="text-sm font-semibold text-primary/60">
                    {totalStr}
                  </span>
                </div>
                <ItemsBlock items={items} onCardClick={onCardClick} />
              </div>

              {/* Order Details */}
              {/* <div className="mb-4">
                <DynamicAttrsSection
                  industry={industry}
                  data={o.dynamicAttributes}
                  label="Order Details"
                />
              </div> */}

              {/* Status & Payment */}
              <div
                className="flex items-center justify-between -mt-3"
                onClick={() => onCardClick?.(o)}
              >
                <div className="text-sm text-muted-foreground">
                  Order Status:
                </div>
                <StatusBadge
                  status={o.orderStatus}
                  paymentStatus={o.paymentStatus}
                />
              </div>

              {/* Action Button & Footer */}
              <div className="mt-auto pt-4 border-t border-gray-100">
                {isChef && action && (
                  <Button
                    variant="header"
                    className="w-full mb-3"
                    onClick={() => onEdit?.(o, action.nextStatus)}
                  >
                    {action.label}
                  </Button>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{timeAgo(o.createdAt)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{totalStr}</div>
                  </div>
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
