'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { fmtTime } from './utils';
import {
  useReserveTableMutation,
  useCancelReservationMutation,
} from '@/features/tableApi';

const getId = (t) => t?._id || t?.id;

const toDateInputValue = (d) => {
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
};

export default function TableReservationsSection({ table, selectedTableId }) {
  const [reserveName, setReserveName] = useState('');
  const [reservePhone, setReservePhone] = useState('');
  const [reserveNote, setReserveNote] = useState('');
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveStart, setReserveStart] = useState('');
  const [reserveEnd, setReserveEnd] = useState('');
  const [editingResId, setEditingResId] = useState(null);

  // confirm cancel dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resToCancel, setResToCancel] = useState(null);

  // date filter (default: today)
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateInputValue(new Date())
  );

  const [reserveTable, { isLoading: reserving }] = useReserveTableMutation();
  const [cancelReservation, { isLoading: canceling }] =
    useCancelReservationMutation();

  const nowTs = Date.now();
  const reservations = Array.isArray(table?.reservations)
    ? table.reservations
    : [];

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

  const toISO = (localValue) => {
    if (!localValue) return null;
    const d = new Date(localValue);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const roundToNext15 = (d = new Date()) => {
    const copy = new Date(d);
    const ms = 15 * 60 * 1000;
    return new Date(Math.ceil(copy.getTime() / ms) * ms);
  };

  // get next available start time (skips overlapping non-canceled reservations)
  const getNextAvailableStart = (allReservations, baseDate) => {
    let candidate = new Date(baseDate);

    const relevant = (allReservations || [])
      .filter((r) => r.status !== 'canceled')
      .slice()
      .sort(
        (a, b) =>
          new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
      );

    for (const r of relevant) {
      const s = new Date(r.startISO).getTime();
      const e = new Date(r.endISO).getTime();
      const c = candidate.getTime();

      // if candidate falls inside this reservation window, jump to its end
      if (c >= s && c < e) {
        candidate = new Date(e);
      }
    }

    return roundToNext15(candidate);
  };

  // filter reservations by selected day (based on local date of startISO)
  const reservationsForDay = useMemo(() => {
    if (!selectedDate) return reservations;

    return reservations.filter((r) => {
      if (!r.startISO) return false;
      const d = new Date(r.startISO);
      const rDate = toDateInputValue(d);
      return rDate === selectedDate;
    });
  }, [reservations, selectedDate]);

  const handleChangeDay = (delta) => {
    if (!selectedDate) {
      setSelectedDate(toDateInputValue(new Date()));
      return;
    }
    const base = new Date(selectedDate + 'T00:00:00');
    if (isNaN(base.getTime())) {
      setSelectedDate(toDateInputValue(new Date()));
      return;
    }
    base.setDate(base.getDate() + delta);
    setSelectedDate(toDateInputValue(base));
  };

  useEffect(() => {
    if (!reserveOpen) return;

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
    if (!startISO || !endISO) {
      return toast.error('Start and end are required');
    }
    if (new Date(startISO) >= new Date(endISO)) {
      return toast.error('End time must be after start');
    }

    try {
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

      // keep the filter on the day of the new reservation
      const createdDate = toDateInputValue(new Date(startISO));
      setSelectedDate(createdDate);
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

  const askCancelConfirmation = (resId) => {
    setResToCancel(resId);
    setConfirmOpen(true);
  };

  const confirmCancel = async () => {
    if (!resToCancel) {
      setConfirmOpen(false);
      return;
    }
    await handleCancelReservation(resToCancel);
    setConfirmOpen(false);
    setResToCancel(null);
  };

  return (
    <>
      <Card className="mt-6 border-dashed">
        <CardHeader className="py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Reservations
            </CardTitle>
          </div>
          {/* Day selector */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleChangeDay(-1)}
            >
              ‹
            </Button>
            <Input
              type="date"
              className="h-8 w-[150px]"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleChangeDay(1)}
            >
              ›
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing reservations for{' '}
            <span className="font-medium">{selectedDate}</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {reservationsForDay.length === 0 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                No reservations for this day.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reservationsForDay
                .slice()
                .sort(
                  (a, b) =>
                    new Date(a.startISO).getTime() -
                    new Date(b.startISO).getTime()
                )
                .map((r) => {
                  const id = r._id || r.id;
                  const start = fmtTime(r.startISO);
                  const end = fmtTime(r.endISO);
                  const now = nowTs;
                  const s = new Date(r.startISO).getTime();
                  const e = new Date(r.endISO).getTime();

                  let badgeVariant = 'secondary';
                  let badgeText = 'Upcoming';

                  if (r.status === 'canceled') {
                    badgeVariant = 'outline';
                    badgeText = 'Canceled';
                  } else if (now >= s && now < e) {
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
                        {r.status === 'upcoming' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => askCancelConfirmation(id)}
                            disabled={canceling}
                          >
                            Cancel
                          </Button>
                        )}
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
                // base is the selected day at midnight, but never in the past
                let base =
                  selectedDate && !isNaN(new Date(selectedDate).getTime())
                    ? new Date(selectedDate + 'T00:00:00')
                    : new Date();

                const now = new Date();
                if (base < now) base = now;

                // choose next available start on that day (using all reservations or just reservationsForDay)
                const nextStart = getNextAvailableStart(
                  reservationsForDay,
                  base
                );
                const nextEnd = new Date(nextStart.getTime() + 60 * 60 * 1000); // +1 hour

                setReserveStart(toLocalInput(nextStart));
                setReserveEnd(toLocalInput(nextEnd));
                setReserveName('');
                setReservePhone('');
                setReserveNote('');
                setEditingResId(null);
                setReserveOpen(true);
              }}
            >
              New Reservation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reserve / edit dialog */}
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
                step={60}
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
                  onClick={() => askCancelConfirmation(editingResId)}
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

      {/* Confirm cancel dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel reservation?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Are you sure you want to cancel this reservation? This action cannot
            be undone.
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setResToCancel(null);
              }}
            >
              No, keep it
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={canceling}
            >
              {canceling ? 'Canceling…' : 'Yes, cancel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
