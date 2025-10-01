'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { OrdersTable } from './orders-table';
import { OrdersGrid } from './orders-grid';
import OrderForm from './order-form';
import { PaginationControls } from './pagination-controls';
import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderItemsMutation,
  useRequestReturnMutation,
  useHandleReturnRequestMutation,
} from '@/features/ordersApi';
import { LayoutGrid, List } from 'lucide-react';
import { useGetInventoryQuery } from '@/features/inventoryApi';
import { useGetAddressesQuery } from '@/features/addressApi';

// helpers for date ranges
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function getRange(rangeKey) {
  const now = new Date();
  switch (rangeKey) {
    case 'today': {
      return { from: startOfDay(now), to: endOfDay(now) };
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last7': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6); // include today → 7 days total
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'lastMonth': {
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endPrev = new Date(firstThisMonth.getTime() - 1); // last day of prev month
      return { from: startOfDay(startPrev), to: endOfDay(endPrev) };
    }
    default:
      return null; // 'all'
  }
}

export default function OrdersClient() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const pageSize = 10;

  // filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // today | yesterday |
  const companyId =
    useSelector((s) => s.auth?.user?.companyId) ||
    useSelector((s) => s.org?.companyId) ||
    'NEW72GJN'; // dev fallback
  const userId =
    useSelector((s) => s.auth?.user?._id) ||
    useSelector((s) => s.auth?.user?.id) ||
    null;

  // fetching order data
  const {
    data: orders = [],
    isLoading,
    isFetching: isValidating,
    isError,
    refetch,
  } = useGetOrdersQuery({ companyId }, { skip: !companyId });
  // console.log("orders are" , orders)
  //fetching inventory
  const { data: inventory = [] } = useGetInventoryQuery();
  //fetching addresses
  const { data: addresses = [], isLoading: addrLoading } = useGetAddressesQuery(
    { companyId },
    { skip: !companyId }
  );

  const formatAddress = (a) => {
    if (!a) return '—';
    const line2 = a.addressLine2 ? `, ${a.addressLine2}` : '';
    return `${a.fullName} • ${a.phoneNumber}
${a.addressLine1}${line2}, ${a.city}, ${a.state} ${a.postalCode}, ${a.country}`;
  };
  // mutations
  const [createOrder] = useCreateOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [cancelOrderItems] = useCancelOrderItemsMutation();
  const [requestReturn] = useRequestReturnMutation();
  const [handleReturn] = useHandleReturnRequestMutation();

  // dialog + edit state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  // reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, paymentFilter, dateRange]);

  const title = useMemo(
    () => (editing ? 'Edit Order' : 'Create Order'),
    [editing]
  );

  // filtering helpers
  const matchesSearch = (o) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const hay = [
      o.orderNumber,
      o.userName,
      o?.user?.name,
      o.userId,
      o.companyId,
      ...(Array.isArray(o.items)
        ? o.items.flatMap((it) => [
            it?.inventoryItem?.itemName,
            it?.inventoryItem?.sku,
            it?.itemName,
            it?.sku,
          ])
        : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  };

  const inDatePreset = (o) => {
    if (dateRange === 'all') return true;
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    const range = getRange(dateRange);
    if (!range) return true;
    return d >= range.from && d <= range.to;
  };

  const byStatus = (o) =>
    statusFilter === 'all'
      ? true
      : String(o.status || '')
          .toLowerCase()
          .includes(statusFilter.toLowerCase());

  const byPayment = (o) =>
    paymentFilter === 'all'
      ? true
      : String(o.paymentStatus || '')
          .toLowerCase()
          .includes(paymentFilter.toLowerCase());

  // filtered + paged
  const filtered = useMemo(() => {
    return orders.filter(
      (o) => matchesSearch(o) && inDatePreset(o) && byStatus(o) && byPayment(o)
    );
  }, [orders, query, statusFilter, paymentFilter, dateRange]);

  const total = filtered.length;
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // handlers
  const handleCreate = async (values) => {
    setSaving(true);
    const payload = {
      ...values,
      ...(companyId ? { companyId } : {}),
      ...(userId ? { userId } : {}),
    };
    try {
      await createOrder(payload).unwrap();
      setOpen(false);
      setEditing(null);
      toast.success('Order created', {
        description: 'The order has been added successfully.',
      });
    } catch (e) {
      toast.error('Failed to create', {
        description: e?.data?.message || e?.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Update order status (server advances eligible items)
  const onUpdateStatus = async (order) => {
    const id = order._id || order.id;
    try {
      await updateOrderStatus(id).unwrap();
      toast.success('Status updated', {
        description: `Order #${order.orderNumber || id}`,
      });
    } catch (e) {
      toast.error('Failed to update status', {
        description: e?.data?.message || e?.message || 'Please try again.',
      });
    }
  };

  // Cancel items (cancel all eligible: pending/processing)
  const onCancelItems = async (order) => {
    const id = order._id || order.id;
    const cancellable = (order.items || [])
      .filter((it) =>
        ['pending', 'processing'].includes(String(it.status || ''))
      )
      .map((it) => it._id || it.id);

    if (cancellable.length === 0) {
      toast.info('Nothing to cancel', {
        description: 'No items in pending/processing.',
      });
      return;
    }

    if (
      !confirm(
        `Cancel ${cancellable.length} item(s) for order #${
          order.orderNumber || id
        }?`
      )
    )
      return;

    try {
      await cancelOrderItems({ id, itemIds: cancellable }).unwrap();
      toast.success('Items cancelled', {
        description: `Order #${order.orderNumber || id}`,
      });
    } catch (e) {
      toast.error('Failed to cancel items', {
        description: e?.data?.message || e?.message || 'Please try again.',
      });
    }
  };

  // Request returns (request on all delivered items; server validates window)
  const onRequestReturn = async (order) => {
    const id = order._id || order.id;
    const delivered = (order.items || [])
      .filter((it) => String(it.status || '') === 'delivered')
      .map((it) => it._id || it.id);

    if (delivered.length === 0) {
      toast.info('No delivered items', {
        description: 'Nothing eligible for return request.',
      });
      return;
    }

    try {
      await requestReturn({ id, itemIds: delivered }).unwrap();
      toast.success('Return request sent', {
        description: `Order #${order.orderNumber || id}`,
      });
    } catch (e) {
      toast.error('Failed to request return', {
        description: e?.data?.message || e?.message || 'Please try again.',
      });
    }
  };

  // Handle return requests (accept/reject all items currently in returned_request)
  const onHandleReturnRequest = async (order, action) => {
    const id = order._id || order.id;
    const pending = (order.items || [])
      .filter((it) => String(it.status || '') === 'returned_request')
      .map((it) => it._id || it.id);

    if (pending.length === 0) {
      toast.info('No pending return requests');
      return;
    }

    try {
      // API is per-item; do them sequentially to surface errors clearly
      for (const itemId of pending) {
        // action is 'accept' or 'reject'
        await handleReturn({ id, itemId, action }).unwrap();
      }
      toast.success(`Return ${action}ed`, {
        description: `Order #${order.orderNumber || id}`,
      });
    } catch (e) {
      toast.error(`Failed to ${action} return`, {
        description: e?.data?.message || e?.message || 'Please try again.',
      });
    }
  };

  const addressMap = useMemo(() => {
    const m = new Map();
    for (const a of addresses) {
      const id = a._id || a.id;
      if (id) m.set(String(id), a);
    }
    return m;
  }, [addresses]);

  const withAddress = useMemo(() => {
    // Make sure each order carries its address object for easy rendering
    return paged.map((o) => ({
      ...o,
      shippingAddress:
        addressMap.get(String(o.shippingAddressId || o.addressId)) || null,
    }));
  }, [paged, addressMap]);

  const loadingIds = deletingIds;

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateRange('all');
  };

  return (
    <main className="mx-auto grid gap-6 p-6">
      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center mt-2">
        <div>
          <h1 className="text-pretty text-3xl font-semibold tracking-tight">
            Orders Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer work orders for your automotive business.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            onClick={() => setView('table')}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>

          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>

              <OrderForm
                initial={editing}
                loading={saving}
                inventory={inventory}
                onSubmit={editing ? handleUpdate : handleCreate}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* hr under header */}
      <hr className="border-border" />

      {/* Search + Filters (flex, no grid) */}
      <section className="w-full">
        <div className="flex flex-wrap md:flex-nowrap items-end gap-2">
          {/* Search */}
          <div className="flex-1 min-w-[240px]">
            <Input
              id="order-search"
              placeholder="Search order #, user, company, item name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div className="w-[9.5rem] shrink-0">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="dateFilter" className="h-9 w-full">
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Order Status */}
          <div className="w-[9.5rem] shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={'h-9 w-full'}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div className="w-[9.5rem] shrink-0">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className={'h-9 w-full'}>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Types</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Showing {paged.length} of {total} {total === 1 ? 'order' : 'orders'}
        </p>
      </div>

      {/* List/Grid + Pagination */}
      <div>
        {view === 'table' ? (
          <OrdersTable
            orders={withAddress} // ⬅️ use withAddress (not paged)
            onEdit={onUpdateStatus} // "Update Order Status"
            onDelete={onCancelItems} // "Cancel Order Items"
            onRequestReturn={onRequestReturn}
            onHandleReturnRequest={onHandleReturnRequest}
            loadingIds={loadingIds}
            renderAddress={(o) => {
              const a = o.shippingAddress || o.shippingAddressSnapshot;
              if (a) return formatAddress(a);
              if (addrLoading && (o.shippingAddressId || o.addressId))
                return 'Loading address…';
              if (o.shippingAddressId || o.addressId)
                return 'Address not found';
              return '—';
            }}
            addressesLoading={addrLoading}
          />
        ) : (
          <OrdersGrid
            orders={withAddress} // ⬅️ use withAddress (not paged)
            onEdit={onUpdateStatus} // "Update Order Status"
            onDelete={onCancelItems} // "Cancel Order Items"
            onRequestReturn={onRequestReturn}
            onHandleReturnRequest={onHandleReturnRequest}
            loadingIds={loadingIds}
            renderAddress={(o) => {
              const a = o.shippingAddress || o.shippingAddressSnapshot;
              if (a) return formatAddress(a);
              if (addrLoading && (o.shippingAddressId || o.addressId))
                return 'Loading address…';
              if (o.shippingAddressId || o.addressId)
                return 'Address not found';
              return '—';
            }}
            addressesLoading={addrLoading}
          />
        )}

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </main>
  );
}
