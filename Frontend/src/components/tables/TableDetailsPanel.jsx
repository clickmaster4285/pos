'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  CookingPot,
  Receipt,
  Users,
  Utensils,
} from 'lucide-react';

import { STATE_META } from './TablesBoard';
import { fmtTime, timeAgo } from './utils';

// ✅ RTK hooks
import {
  useAssignWaiterMutation,
  useActiveDineInOrderByTableQuery,
  useReserveTableMutation,
  useCancelReservationMutation,
} from '@/features/tableApi';
import { useGetAllStaffQuery } from '@/features/staffApi';

// normalize id from API
const getId = (t) => t?._id || t?.id;

export default function TableDetailsPanel({
  table,
  tables,
  setTables,
  seatings,
  setSeatings,
  orders,
  setOrders,
  demoMode = false, // keep, but we’ll use API for waiter assign
  selectedTableId,
}) {
  const [assignWaiterId, setAssignWaiterId] = useState('');

  // Reservation form fields
  const [reserveName, setReserveName] = useState('');
  const [reservePhone, setReservePhone] = useState('');
  const [reserveNote, setReserveNote] = useState('');

  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveStart, setReserveStart] = useState('');
  const [reserveEnd, setReserveEnd] = useState('');

  // Reserve / Cancel reservation mutations
  const [reserveTable, { isLoading: reserving }] = useReserveTableMutation();
  const [cancelReservation, { isLoading: canceling }] =
    useCancelReservationMutation();

  // Seatings/orders are demo-only; safe-guard
  const currentSeating = useMemo(
    () => (table ? seatings.find((s) => s.id === table.seatingId) : null),
    [seatings, table]
  );
  const currentOrder = useMemo(
    () => (table ? orders.find((o) => o.id === table.currentOrderId) : null),
    [orders, table]
  );

  // ✅ Fetch staff and filter waiters
  const { data: staff, isLoading: waitersLoading } = useGetAllStaffQuery();
  const waiterList = useMemo(() => {
    const list = Array.isArray(staff?.data)
      ? staff.data
      : Array.isArray(staff)
      ? staff
      : [];
    return list.filter((s) => (s?.subRole || '').toLowerCase() === 'waiter');
  }, [staff]);

  // Map waiterId → name for display
  const waiterMap = useMemo(() => {
    const m = new Map();
    waiterList.forEach((w) =>
      m.set(w._id || w.id, w.name || w.fullName || w.email || 'Waiter')
    );
    return m;
  }, [waiterList]);

  const assignedWaiterName = table?.assignedWaiterId
    ? waiterMap.get(table.assignedWaiterId) || 'Waiter'
    : null;

  // Prefill select with current waiter (if any)
  useEffect(() => {
    if (table?.assignedWaiterId) {
      setAssignWaiterId(table.assignedWaiterId);
    } else {
      setAssignWaiterId('');
    }
  }, [table?.assignedWaiterId]);

  // ✅ Assign waiter mutation
  const [assignWaiter, { isLoading: assigning }] = useAssignWaiterMutation();

  // === Actions ===
  const handleAssignWaiter = async () => {
    if (!table) return;
    const tableId = getId(table);
    if (!tableId) return toast.error('Invalid table');

    if (!assignWaiterId) {
      toast.warning('Pick a waiter first');
      return;
    }
    try {
      await assignWaiter({ id: tableId, waiterId: assignWaiterId }).unwrap();
      toast.success(`Assigned to ${waiterMap.get(assignWaiterId) || 'Waiter'}`);
      // listTables will refetch via invalidatesTags; UI will update
    } catch (err) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        'Failed to assign waiter';
      toast.error(msg);
    }
  };
  //for showing order data based on table id
  const tableIdForQuery = selectedTableId || getId(table);
  const {
    data: activeOrder,
    isFetching: fetchingOrder,
    isError: orderError,
  } = useActiveDineInOrderByTableQuery(tableIdForQuery, {
    skip: !tableIdForQuery,
  });
  const currency = (n) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

  // Keep your demo handlers (no-op or toasts) — unchanged:
  const disabledMsg = () =>
    toast.info('Wire this action to your API mutations');
  const handleCreateOrder = () => (demoMode ? disabledMsg() : disabledMsg());
  const handleMarkReady = () => (demoMode ? disabledMsg() : disabledMsg());
  const handleTakePayment = () => (demoMode ? disabledMsg() : disabledMsg());
  // reservations



  const nowTs = Date.now();

  const reservations = Array.isArray(table?.reservations)
    ? table.reservations
    : [];

  const activeRes = useMemo(
    () =>
      reservations.find((r) => {
        const s = new Date(r.startISO).getTime();
        const e = new Date(r.endISO).getTime();
        return nowTs >= s && nowTs < e;
      }) || null,
    [reservations, nowTs]
  );

  const upcomingRes = useMemo(
    () =>
      reservations
        .filter((r) => new Date(r.startISO).getTime() > nowTs)
        .sort((a, b) => new Date(a.startISO) - new Date(b.startISO))[0] || null,
    [reservations, nowTs]
  );

  // Use this for display (active > upcoming > null)
  const shownRes = activeRes || upcomingRes || null;

  // Track which reservation you’re editing (for “Edit”/“Cancel”)
  const [editingResId, setEditingResId] = useState(null);

  // "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
  const toLocalInput = (d) => {
    if (!d) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  // Convert local input back to ISO
  const toISO = (localValue) => {
    if (!localValue) return null;
    const d = new Date(localValue); // treated as local time
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  // Round a Date to next 15 minutes
  const roundToNext15 = (d = new Date()) => {
    const copy = new Date(d);
    const ms = 15 * 60 * 1000;
    return new Date(Math.ceil(copy.getTime() / ms) * ms);
  };

  useEffect(() => {
    if (!reserveOpen) return;

    // Only prefill for EDIT mode. New mode already sets defaults above.
    if (editingResId) {
      const res = reservations.find((r) => (r._id || r.id) === editingResId);
      if (res) {
        setReserveStart(toLocalInput(new Date(res.startISO)));
        setReserveEnd(toLocalInput(new Date(res.endISO)));
        setReserveName(res.name || '');
        setReservePhone(res.phone || '');
        setReserveNote(res.note || '');
      }
    }
  }, [reserveOpen, editingResId, reservations]);

  const handleReserveSave = async () => {
    const tableId = selectedTableId || getId(table);
    if (!tableId) return toast.error('Invalid table');

    const startISO = toISO(reserveStart);
    const endISO = toISO(reserveEnd);
    if (!startISO || !endISO) return toast.error('Start and end are required');
    if (new Date(startISO) >= new Date(endISO))
      return toast.error('End time must be after start');

    try {
      // Create a new reservation (don’t overwrite)
      await reserveTable({
        id: tableId,
        startISO,
        endISO,
        name: reserveName?.trim() || undefined,
        phone: reservePhone?.trim() || undefined,
        note: reserveNote?.trim() || undefined,
      }).unwrap();

      toast.success('Reservation saved');
      setReserveOpen(false);
      setEditingResId(null);
    } catch (err) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        'Failed to save reservation';
      toast.error(msg);
    }
  };

  const handleCancelReservation = async (resId) => {
    const tableId = selectedTableId || getId(table);
    if (!tableId || !resId) return toast.error('Invalid reservation');

    try {
      await cancelReservation({ id: tableId, resId }).unwrap();
      toast.success('Reservation canceled');
      if (editingResId === resId) setEditingResId(null);
    } catch (err) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        'Failed to cancel reservation';
      toast.error(msg);
    }
  };

  if (!table) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Select a table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Pick a table to see details.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Utensils className="h-5 w-5" />
            {table.name} · {table.seats} seats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* State + info row */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className={`${
                STATE_META[table.state]?.tint || ''
              } rounded-full py-1 px-3`}
            >
              <span
                className={`mr-2 inline-block h-2 w-2 rounded-full ${
                  STATE_META[table.state]?.dot || ''
                }`}
              />
              {STATE_META[table.state]?.label || table.state}
            </Badge>

            {!!assignedWaiterName && (
              <span className="text-sm text-muted-foreground">
                Assigned to {assignedWaiterName}
              </span>
            )}

            {table.seatingId && currentSeating?.startedAt && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Seated{' '}
                {timeAgo(currentSeating.startedAt)}
              </span>
            )}

            {table.reservation?.startISO && table.reservation?.endISO && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Reserved {fmtTime(table.reservation.startISO)} –{' '}
                {fmtTime(table.reservation.endISO)}
              </span>
            )}
          </div>

          <Separator className="my-4" />

          {/* Assign waiter — now using API list & mutation */}
          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="col-span-2">
              <Label className="mb-1 block">Assign Waiter</Label>
              <Select
                value={assignWaiterId}
                onValueChange={setAssignWaiterId}
                disabled={waitersLoading || assigning}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      assignedWaiterName
                        ? `Change waiter (current: ${assignedWaiterName})`
                        : waitersLoading
                        ? 'Loading waiters…'
                        : 'Pick waiter'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {waitersLoading && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Loading…
                    </div>
                  )}
                  {!waitersLoading && waiterList.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No waiters found
                    </div>
                  )}
                  {!waitersLoading &&
                    waiterList.map((w) => (
                      <SelectItem key={w._id || w.id} value={w._id || w.id}>
                        {w.name || w.fullName || w.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <Button
                className="w-full"
                onClick={handleAssignWaiter}
                disabled={!assignWaiterId || assigning}
              >
                <Users className="h-4 w-4 mr-2" />
                {assigning ? 'Assigning…' : 'Assign'}
              </Button>
            </div>
          </div>

          {/* Current order (demo placeholders) */}
          <Card className="mt-4 border-dashed">
            {fetchingOrder ? (
              <div className="text-sm text-muted-foreground">
                Loading order…
              </div>
            ) : orderError ? (
              <div className="text-sm text-red-600">Failed to load order</div>
            ) : !activeOrder ? (
              <div className="flex items-center justify-between px-3">
                <div className="text-sm text-muted-foreground">
                  No active order
                </div>
                <Button size="sm" onClick={handleCreateOrder}>
                  New Dine-In Order
                </Button>
              </div>
            ) : (
              <div className="px-4 space-y-3 ">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <CardTitle className="text-base flex items-center gap-2 mb-3">
                      <CookingPot className="h-4 w-4" /> Order Details
                    </CardTitle>

                    <div className="font-medium">
                      <span>Order No: </span>
                      {activeOrder.orderNo || 'Order'}
                    </div>
                    {activeOrder.createdAt && (
                      <div className="text-muted-foreground text-xs">
                        Created {timeAgo(activeOrder.createdAt)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {activeOrder.orderStatus || 'pending'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {(activeOrder.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="truncate">
                        <span className="font-medium">{it.name}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          × {it.qty}
                        </span>
                      </div>
                      <div className="tabular-nums">
                        {currency(it.total ?? (it.price || 0) * (it.qty || 0))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">
                      {currency(activeOrder.subTotal ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Reservation (unchanged UI; wire later) */}
          <Card className="mt-6 border-dashed">
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Reservations
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {reservations.length === 0 ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    No reservations yet
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingResId(null);
                      setReserveOpen(true);
                    }}
                  >
                    Reserve
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations
                    .slice()
                    .sort((a, b) => new Date(a.startISO) - new Date(b.startISO))
                    .map((r) => {
                      const id = r._id || r.id;
                      const start = fmtTime(r.startISO);
                      const end = fmtTime(r.endISO);
                      const now = Date.now();
                      const s = new Date(r.startISO).getTime();
                      const e = new Date(r.endISO).getTime();

                      let badgeVariant = 'secondary';
                      let badgeText = 'Upcoming';
                      if (now >= s && now < e) {
                        badgeVariant = 'default';
                        badgeText = 'Active';
                      } else if (now >= e) {
                        badgeVariant = 'outline';
                        badgeText = 'Past';
                      }

                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between border rounded-md p-2"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {start} – {end}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.name ? `${r.name} · ` : ''}
                              {r.phone || ''}
                              {r.note ? ` · ${r.note}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={badgeVariant}>{badgeText}</Badge>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                setEditingResId(id);
                                setReserveOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleCancelReservation(id)}
                              disabled={canceling}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="pt-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const start = roundToNext15(new Date());
                    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
                    setReserveStart(toLocalInput(start));
                    setReserveEnd(toLocalInput(end));
                    setReserveName('');
                    setReservePhone('');
                    setReserveNote('');
                    setEditingResId(null); // new reservation mode
                    setReserveOpen(true);
                  }}
                >
                  New Reservation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions (wire later) */}
          {/* <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setReserveOpen(true)}>
              Reserve
            </Button>
            <Button variant="outline" onClick={handleFreeTable}>
              Free Table
            </Button>
          </div> */}
        </CardContent>
      </Card>

      {/* Reserve dialog (fields only for now) */}
      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingResId ? 'Edit Reservation' : 'Reserve Table'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <Label>Start</Label>
              <Input
                type="datetime-local"
                step={60} // 1-minute granularity
                min={toLocalInput(new Date())}
                value={reserveStart}
                onChange={(e) => setReserveStart(e.target.value)}
              />
            </div>

            <div>
              <Label>End</Label>
              <Input
                type="datetime-local"
                step={60}
                min={reserveStart || toLocalInput(new Date())}
                value={reserveEnd}
                onChange={(e) => setReserveEnd(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name (optional)</Label>
                <Input
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  value={reservePhone}
                  onChange={(e) => setReservePhone(e.target.value)}
                  placeholder="+92…"
                />
              </div>
            </div>

            <div>
              <Label>Note (optional)</Label>
              <Input
                value={reserveNote}
                onChange={(e) => setReserveNote(e.target.value)}
                placeholder="Any special request"
              />
            </div>

            <div className="flex justify-end gap-2">
              {editingResId ? (
                <Button
                  variant="outline"
                  onClick={() => handleCancelReservation(editingResId)}
                  disabled={canceling}
                >
                  {canceling ? 'Canceling…' : 'Cancel Reservation'}
                </Button>
              ) : null}

              <Button onClick={handleReserveSave} disabled={reserving}>
                {reserving ? 'Saving…' : 'Save Reservation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
