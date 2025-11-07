'use client';
import React, { useMemo } from 'react';
import { ClipboardList, Users } from 'lucide-react';
import { STATE_META } from './TablesBoard';
import { fmtTime } from './utils';
import { useGetAllStaffQuery } from '@/features/staffApi';

const getId = (t) => t?._id || t?.id;

export default function TableGrid({ tables, selectedId, onSelect }) {
  // Load staff and filter waiters
  const {
    data: staff,
    isLoading: waitersLoading,
    isError,
  } = useGetAllStaffQuery();

  // Normalize staff array (supports both [..] and { data: [...] })
  const staffArray = useMemo(() => {
    if (Array.isArray(staff)) return staff;
    if (staff && Array.isArray(staff.data)) return staff.data;
    return [];
  }, [staff]);

  const waiterList = useMemo(
    () =>
      staffArray.filter(
        (s) => String(s?.subRole || '').toLowerCase() === 'waiter'
      ),
    [staffArray]
  );

  // Build a map: waiterId -> displayName
  const waiterNameById = useMemo(() => {
    const map = new Map();
    waiterList.forEach((w) => {
      const id = String(w._id || w.id);
      const name = w.name || w.fullName || w.email || 'Waiter';
      map.set(id, name);
    });
    return map;
  }, [waiterList]);

  if (!tables?.length) {
    return (
      <div className="text-sm text-muted-foreground p-4">No tables here.</div>
    );
  }

return (
  <div className="grid grid-cols-3 gap-3 mt-4">
    {tables.map((t) => {
      const id = getId(t);
      const assignedName = t.assignedWaiterId
        ? waiterNameById.get(String(t.assignedWaiterId))
        : null;

      const state = t?.state || 'available';

      return (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`rounded-2xl border p-4 text-left shadow-sm transition hover:shadow ${
            selectedId === id ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold">{t.name}</div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                STATE_META[state]?.tint || ''
              }`}
            >
              {STATE_META[state]?.label || state}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{t.seats} seats</span>
          </div>

          {/* Always show who it's assigned to, if present */}
          {t.assignedWaiterId && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>
                Assigned to {waitersLoading ? '…' : assignedName || '—'}
              </span>
            </div>
          )}

          <div className="mt-2 text-xs text-muted-foreground">
            {state === 'available' && 'Ready for guests'}
            {state === 'occupied' && 'Guests seated • Order running'}
            {state === 'awaiting_payment' && 'Waiting for payment'}
            {state === 'reserved' &&
              (t.reservation?.startISO && t.reservation?.endISO
                ? `Reserved ${fmtTime(t.reservation.startISO)}–${fmtTime(
                    t.reservation.endISO
                  )}`
                : 'Reservation holding')}
          </div>
        </button>
      );
    })}
  </div>
);


}
