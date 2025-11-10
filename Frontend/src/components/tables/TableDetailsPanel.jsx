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
import { toast } from 'sonner';
import { Calendar, Clock, Users, Utensils } from 'lucide-react';

import { STATE_META } from './TablesBoard';
import { fmtTime, timeAgo } from './utils';

import {
  useAssignWaiterMutation,
  useRemoveTableMutation,
} from '@/features/tableApi';
import { useGetAllStaffQuery } from '@/features/staffApi';

// child components
import TableOrderSection from './TableOrderSection';
import TableReservationsSection from './TableReservationsSection';

const getId = (t) => t?._id || t?.id;

export default function TableDetailsPanel({
  table,
  tables,
  setTables,
  seatings,
  setSeatings,
  orders,
  setOrders,
  demoMode = false,
  selectedTableId,
}) {
  const [assignWaiterId, setAssignWaiterId] = useState('');

  const currentSeating = useMemo(
    () => (table ? seatings.find((s) => s.id === table.seatingId) : null),
    [seatings, table]
  );

  // staff / waiters
  const { data: staff, isLoading: waitersLoading } = useGetAllStaffQuery();
  const waiterList = useMemo(() => {
    const list = Array.isArray(staff?.data)
      ? staff.data
      : Array.isArray(staff)
      ? staff
      : [];
    return list.filter((s) => (s?.subRole || '').toLowerCase() === 'waiter');
  }, [staff]);

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

  useEffect(() => {
    if (table?.assignedWaiterId) {
      setAssignWaiterId(table.assignedWaiterId);
    } else {
      setAssignWaiterId('');
    }
  }, [table?.assignedWaiterId]);

  const [assignWaiter, { isLoading: assigning }] = useAssignWaiterMutation();
  const [removeTable, { isLoading: removing }] = useRemoveTableMutation();

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
    } catch (err) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        'Failed to assign waiter';
      toast.error(msg);
    }
  };

  const handleDeleteTable = async () => {
    if (!table) return;
    const tableId = getId(table);
    if (!tableId) return toast.error('Invalid table');

    const confirmed = window.confirm(
      `Are you sure you want to delete table "${table.name}"?`
    );
    if (!confirmed) return;

    try {
      await removeTable(tableId).unwrap();
      toast.success('Table deleted');
      // After delete, parent will refetch via invalidatesTags from tableApi
      // You could also clear selection here if needed.
    } catch (err) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        'Failed to delete table';
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

  const tableIdForQuery = selectedTableId || getId(table);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Utensils className="h-5 w-5" />
          {table.name} · {table.seats} seats
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* State + waiter row */}
        <div className="flex flex-col gap-4">
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

          <Separator className="my-2" />

          {/* Assign waiter */}
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
        </div>

        {/* Orders */}
        <TableOrderSection tableId={tableIdForQuery} demoMode={demoMode} />

        {/* Reservations */}
        <TableReservationsSection
          table={table}
          selectedTableId={selectedTableId}
        />

        {/* Delete table */}
        <div className="mt-5 flex justify-end">
          <Button
            variant="destructive"
            onClick={handleDeleteTable}
            disabled={removing}
          >
            {removing ? 'Deleting…' : 'Delete Table'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
