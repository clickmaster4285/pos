'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TableModel from '@/components/tables/TableModel';
import { useMemo, useState } from 'react';
import { useGetAllStaffQuery } from '@/features/staffApi';

export default function DynamicFieldInputs({
  fields, // already scoped
  value = {},
  onChange,
  label = 'Dynamic Attributes',
  compact = false,
  tables = [],
  onTableSelect,
}) {
  if (!fields?.length) return null;

  const [isOpen, setIsOpen] = useState(false);

  const setVal = (name, v) => onChange?.({ ...value, [name]: v });

  // fetch waiters for TableModel dropdown
  const { data: staffData } = useGetAllStaffQuery();
  const waiters = useMemo(() => {
    const arr = Array.isArray(staffData) ? staffData : staffData?.data || [];
    return arr
      .filter((s) => String(s?.subRole || '').toLowerCase() === 'waiter')
      .map((s) => ({
        id: String(s?._id || s?.id),
        name: s?.fullName || s?.name || 'Unnamed',
      }));
  }, [staffData]);

  // called by TableModel after successful creation
  const handleCreated = (createdDoc) => {
    const createdId = String(createdDoc?._id || createdDoc?.id || '');
    if (createdId) {
      const next = { ...(value || {}), tableNo: createdId };
      onChange?.(next); // set dynamicAttributes.tableNo
      onTableSelect?.(createdId); // let parent auto-fill waiter, etc.
    }
    setIsOpen(false); // close modal
  };

  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium">{label}</div>

      <div
        className={`grid gap-3 ${
          compact
            ? 'grid-cols-1 sm:grid-cols-2'
            : '[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]'
        }`}
      >
        {fields.map((f) => {
          const v = value?.[f.name] ?? '';

          // TABLE SELECT
          if (f.name === 'tableNo' && Array.isArray(tables)) {
            return (
              <div key={f.name} className="grid gap-1.5 min-w-0">
                <Label className="text-xs text-muted-foreground">
                  {f.label || 'Table'}
                </Label>

                <Select
                  value={v || undefined}
                  onValueChange={(val) => {
                    if (val === '__create__') {
                      setIsOpen(true); // open create modal
                      return; // This prevents the "__create__" value from being stored
                    }
                    const next = { ...(value || {}), tableNo: val };
                    onChange?.(next);
                    onTableSelect?.(val);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select Table" />
                  </SelectTrigger>

                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t._id} value={String(t._id)}>
                        {t.name}
                      </SelectItem>
                    ))}

                    <div className="my-1 border-t" />

                    {/* special option to create */}
                    <SelectItem
                      value="__create__"
                      className="text-primary font-medium"
                    >
                      + Create new table
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // WAITER NAME (read-only)
          if (f.name === 'waiterName') {
            return (
              <div key={f.name} className="grid gap-1.5 min-w-0">
                <Label className="text-xs">{f.label || 'Waiter'}</Label>
                <Input
                  value={String(v || '')}
                  readOnly
                  className="h-9"
                  placeholder="Auto-filled"
                />
              </div>
            );
          }

          // Hide waiterId field if present (we store it, but don’t edit here)
          if (f.name === 'waiterId') return null;

          // DATE
          if (f.type === 'date') {
            return (
              <div key={f.name} className="grid gap-1.5 min-w-0">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type="date"
                  value={v ? String(v).substring(0, 10) : ''}
                  onChange={(e) => setVal(f.name, e.target.value)}
                  className="h-9"
                />
              </div>
            );
          }

          // DEFAULT INPUT
          return (
            <div key={f.name} className="grid gap-1.5 min-w-0">
              <Label className="text-xs">{f.label}</Label>
              <Input
                value={v}
                onChange={(e) => setVal(f.name, e.target.value)}
                className="h-9"
                placeholder={f.label}
              />
            </div>
          );
        })}
      </div>

      {/* Create Table Modal — handles its own mutation; calls back on success */}
      <TableModel
        open={isOpen}
        onOpenChange={setIsOpen}
        waiters={waiters}
        onCreated={handleCreated}
      />
    </div>
  );
}
