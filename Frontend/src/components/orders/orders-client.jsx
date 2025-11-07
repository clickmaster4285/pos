'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import OrderDetailsSheet from './OrderDetailsSheet';
import { PaginationControls } from './pagination-controls';
import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useRefundOrderMutation,
  //  useReplaceItemsMutation,
  useUpdateStatusMutation,
} from '@/features/orderApi';
import { LayoutGrid, List } from 'lucide-react';
// If you really have these APIs, keep them. Otherwise safely skip them.
import { useGetProductByIdQuery } from '@/features/productApi';
import { useGetAddressesQuery } from '@/features/addressApi';
import { billsApi } from '@/features/billingApi';
import { orderApi } from '@/features/orderApi';

/* ------------------------ date helpers ------------------------ */
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
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'lastMonth': {
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endPrev = new Date(firstThisMonth.getTime() - 1);
      return { from: startOfDay(startPrev), to: endOfDay(endPrev) };
    }
    default:
      return null; // 'all'
  }
}

export default function OrdersClient() {
  /* --------------------------- state --------------------------- */
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const pageSize = 10;

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const companyId =
    useSelector((s) => s.auth?.user?.companyId) ||
    useSelector((s) => s.org?.companyId) ||
    'NEW72GJN'; // fallback for dev

  const userId =
    useSelector((s) => s.auth?.user?._id) ||
    useSelector((s) => s.auth?.user?.id) ||
    null;

  //-------------selecting role----------------//
  const user = useSelector((state) => state.auth.user);
  const industry = user?.industryName || '';

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const isWaiter = (user?.subRole || '').toLowerCase() === 'waiter';
  const isChef = (user?.subRole || '').toLowerCase() === 'chef';

  const role = String(user?.role || '').toLowerCase();
  const isEndUser = role === 'user';

  /* -------------------------- queries -------------------------- */
  // Your slice says: getOrders() takes no args and reads companyId from JWT.
  const {
    data: ordersResp,
    isLoading,
    isFetching: isValidating,
    isError,
    refetch,
  } = useGetOrdersQuery(undefined, {
    skip: !companyId,
    skip: !companyId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 900000,
  });

  // Normalize to array (your slice already does transformResponse -> [])
  const orders = Array.isArray(ordersResp) ? ordersResp : [];

  // If product API requires an id, skip; otherwise pass your real id.
  const { data: product = [], isLoading: productLoading } =
    useGetProductByIdQuery(undefined, { skip: true });

  // Addresses by company (used to render a nice shipping block)
  const { data: addresses = [], isLoading: addrLoading } = useGetAddressesQuery(
    { companyId },
    { skip: !companyId }
  );

  // 🔁 Refetch tables whenever ANY createOrder mutation (from anywhere) succeeds
  const lastCreateIdRef = useRef(null);
  const createBillFulfilled = useSelector((state) => {
    const bucket = state[billsApi.reducerPath]?.mutations ?? {};
    for (const k in bucket) {
      const m = bucket[k];
      if (m?.endpointName === 'createBill' && m?.status === 'fulfilled') {
        // return the most recent fulfilled entry we see
        return { requestId: m?.requestId ?? k, data: m?.data };
      }
    }
    return null;
  });

  useEffect(() => {
    if (!createBillFulfilled) return;
    const { requestId } = createBillFulfilled;
    if (requestId && requestId !== lastCreateIdRef.current) {
      lastCreateIdRef.current = requestId;
      refetch(); // refresh table states after a new order is created
    }
  }, [createBillFulfilled, refetch]);

  // 🔁 Refetch when ANY updateStatus mutation succeeds (in this tab)
  const lastUpdateIdRef = useRef(null);
  const updateStatusFulfilled = useSelector((state) => {
    const bucket = state[orderApi.reducerPath]?.mutations ?? {};
    for (const k in bucket) {
      const m = bucket[k];
      if (m?.endpointName === 'updateStatus' && m?.status === 'fulfilled') {
        return { requestId: m?.requestId ?? k, data: m?.data };
      }
    }
    return null;
  });

  useEffect(() => {
    if (!updateStatusFulfilled) return;
    const { requestId } = updateStatusFulfilled;
    if (requestId && requestId !== lastUpdateIdRef.current) {
      lastUpdateIdRef.current = requestId;
      refetch(); // refresh orders list
    }
  }, [updateStatusFulfilled, refetch]);

  /* ----------------------- format helpers ---------------------- */
  const formatAddress = (a) => {
    if (!a) return '—';
    const line2 = a.addressLine2 ? `, ${a.addressLine2}` : '';
    return `${a.fullName} • ${a.phoneNumber}
${a.addressLine1}${line2}, ${a.city}, ${a.state} ${a.postalCode}, ${a.country}`;
  };

  /* ------------------------- mutations ------------------------- */
  const [createOrder] = useCreateOrderMutation();
  const [updateOrderStatus] = useUpdateStatusMutation();
  const [cancelOrderItems] = useCancelOrderMutation();
  const [requestReturn] = useRefundOrderMutation();
  // const [handleReturn] = useReplaceItemsMutation();

  /* ------------------- dialog + edit placeholders --------------- */
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openOrderSheet = (order) => {
    const addr =
      addressMap.get(String(order.shippingAddressId || order.addressId)) ||
      order.shippingAddress ||
      order.shippingAddressSnapshot ||
      null;
    setSelectedOrder({ ...order, shippingAddress: addr });
    setOrderSheetOpen(true);
  };

  // these are present in props; keep as no-ops/compat for table/grid
  const [deletingIds] = useState(new Set());

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, paymentFilter, dateRange]);

  const title = useMemo(
    () => (editing ? 'Edit Order' : 'Create Order'),
    [editing]
  );

  /* ------------------------- filtering ------------------------- */
  const matchesSearch = (o) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const hay = [
      o.orderNumber || o.orderNo, // support both keys
      o.userName,
      o?.user?.name,
      o.userId,
      o.companyId,
      ...(Array.isArray(o.items)
        ? o.items.flatMap((it) => [
            it?.productItem?.itemName,
            it?.productItem?.sku,
            it?.itemName,
            it?.sku,
            it?.name,
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

  const byStatus = (o) => {
    const val = String(o.status || o.orderStatus || '').toLowerCase();
    return statusFilter === 'all'
      ? true
      : val.includes(statusFilter.toLowerCase());
  };

  const byPayment = (o) => {
    const val = String(o.paymentStatus || '').toLowerCase();
    return paymentFilter === 'all'
      ? true
      : val.includes(paymentFilter.toLowerCase());
  };

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

  /* ------------------------- handlers -------------------------- */
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
        description:
          e?.data?.error ||
          e?.data?.message ||
          e?.message ||
          'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // In your slice, status update is PUT /update-order-status/:id (no body)
  // In OrdersClient.jsx

  // OrdersClient.jsx
  const onUpdateStatus = async (order, nextStatus) => {
    const id = order._id || order.id;

    // decide the status you want to set
    const desiredStatus = nextStatus || order?.orderStatus;

    try {
      // ✅ send a flat object: { id, status: 'cooking' }
      await updateOrderStatus({ id, status: desiredStatus }).unwrap();
      refetch();
    } catch (e) {
      toast.error('Failed to update status', {
        description:
          e?.data?.error ||
          e?.data?.message ||
          e?.message ||
          'Please try again.',
      });
    }
  };

  // Cancel items for pending/processing
  // Replace your existing onCancelItems with this version
  const onCancelItems = async (order) => {
    const id = order._id || order.id;

    // Robust admin check (role or subRole; include common variants)
    const roleLC = String(user?.role || '').toLowerCase();
    const subRoleLC = String(user?.subRole || '').toLowerCase();
    const isAdmin =
      roleLC === 'admin' ||
      subRoleLC === 'admin' ||
      roleLC === 'super_admin' ||
      roleLC === 'owner';

    // Normalize status helpers
    const norm = (s) =>
      String(s || '')
        .trim()
        .toLowerCase();
    const isAlreadyCancelled = (it) =>
      norm(it.status) === 'cancelled' ||
      norm(it.status) === 'canceled' ||
      it.isCancelled === true;

    // Build cancellable list
    const cancellable = (order.items || [])
      .filter((it) => {
        if (isAlreadyCancelled(it)) return false; // never send already-cancelled
        if (isAdmin) return true; // admin: any remaining status
        return norm(it.status) === 'pending'; // staff/user: only pending
      })
      .map((it) => it._id || it.id)
      .filter(Boolean);

    if (cancellable.length === 0) {
      toast.info('Nothing to cancel', {
        description: isAdmin
          ? 'No items available to cancel.'
          : 'Only pending items can be cancelled by staff.',
      });
      return;
    }

    if (
      !confirm(
        `Cancel ${cancellable.length} item(s) for order #${
          order.orderNumber || order.orderNo || id
        }?`
      )
    )
      return;

    try {
      await cancelOrderItems({ id, itemIds: cancellable }).unwrap();
      toast.success('Items cancelled', {
        description: `Order #${order.orderNumber || order.orderNo || id}`,
      });
    } catch (e) {
      toast.error('Failed to cancel items', {
        description:
          e?.data?.error ||
          e?.data?.message ||
          e?.message ||
          'Please try again.',
      });
    }
  };




  // Request return for delivered items
  const onRequestReturn = async (order) => {
    const id = order._id || order.id;
    const delivered = (order.items || [])
      .filter((it) => String(it.status || '').toLowerCase() === 'delivered')
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
        description: `Order #${order.orderNumber || order.orderNo || id}`,
      });
    } catch (e) {
      toast.error('Failed to request return', {
        description:
          e?.data?.error ||
          e?.data?.message ||
          e?.message ||
          'Please try again.',
      });
    }
  };

  // Accept/Reject pending return requests
  // const onHandleReturnRequest = async (order, action) => {
  //   const id = order._id || order.id;
  //   const pending = (order.items || [])
  //     .filter(
  //       (it) => String(it.status || '').toLowerCase() === 'returned_request'
  //     )
  //     .map((it) => it._id || it.id);

  //   if (pending.length === 0) {
  //     toast.info('No pending return requests');
  //     return;
  //   }

  //   try {
  //     for (const itemId of pending) {
  //       await handleReturn({ id, itemId, action }).unwrap();
  //     }
  //     toast.success(`Return ${action}ed`, {
  //       description: `Order #${order.orderNumber || order.orderNo || id}`,
  //     });
  //   } catch (e) {
  //     toast.error(`Failed to ${action} return`, {
  //       description:
  //         e?.data?.error ||
  //         e?.data?.message ||
  //         e?.message ||
  //         'Please try again.',
  //     });
  //   }
  // };
  // normalize order status
  const normStatus = (o) =>
    String(o.status || o.orderStatus || '')
      .trim()
      .toLowerCase();

  // statuses to hide for chef
  const CHEF_HIDE = new Set([
    'collected', // takeaway picked up
    'handed_over',
  ]);

  const addressMap = useMemo(() => {
    const m = new Map();
    for (const a of addresses) {
      const id = a._id || a.id;
      if (id) m.set(String(id), a);
    }
    return m;
  }, [addresses]);

  const withAddress = useMemo(() => {
    return (paged || []).map((o) => ({
      ...o,
      shippingAddress:
        addressMap.get(String(o.shippingAddressId || o.addressId)) ||
        o.shippingAddress ||
        o.shippingAddressSnapshot ||
        null,
    }));
  }, [paged, addressMap]);

  const visibleOrders = useMemo(() => {
    if (!isChef) return withAddress;
    return withAddress.filter((o) => !CHEF_HIDE.has(normStatus(o)));
  }, [withAddress, isChef]);

  /* ----------------------- order details ----------------------- */

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateRange('all');
  };

  /* --------------------------- UI ------------------------------ */
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
          {!isChef && (
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
                    setEditing(null); // only create for now
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
                  isEndUser={isEndUser}
                  loading={saving}
                  product={product}
                  onSubmit={handleCreate}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <hr className="border-border" />

      {/* Filters */}
      <section className="w-full">
        <div className="flex flex-wrap md:flex-nowrap items-end gap-2">
          <div className="flex-1 min-w-[240px]">
            <Input
              id="order-search"
              placeholder="Search order #, user, company, item name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

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

          <div className="w-[9.5rem] shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full">
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

          <div className="w-[9.5rem] shrink-0">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-9 w-full">
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

          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Loading…'
            : `Showing ${paged.length} of ${total} ${
                total === 1 ? 'order' : 'orders'
              }`}
        </p>
        {isError && (
          <p className="text-sm text-red-500">Failed to load orders.</p>
        )}
      </div>

      {/* Grid/Table */}
      <div>
        {view === 'table' ? (
          <OrdersTable
            isChef={isChef}
            isAdmin={isAdmin}
            orders={visibleOrders}
            onEdit={onUpdateStatus}
            onDelete={onCancelItems}
            onRequestReturn={onRequestReturn}
            //  onHandleReturnRequest={onHandleReturnRequest}
            loadingIds={deletingIds}
            onRowClick={openOrderSheet}
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
            isChef={isChef}
            isAdmin={isAdmin}
            orders={visibleOrders}
            onEdit={onUpdateStatus}
            onDelete={onCancelItems}
            onRequestReturn={onRequestReturn}
            //  onHandleReturnRequest={onHandleReturnRequest}
            loadingIds={deletingIds}
            onCardClick={openOrderSheet}
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

        <OrderDetailsSheet
          open={orderSheetOpen}
          onOpenChange={(o) => {
            setOrderSheetOpen(o);
            if (!o) setSelectedOrder(null);
          }}
          order={selectedOrder}
          formatAddress={formatAddress}
        />
      </div>
    </main>
  );
}
