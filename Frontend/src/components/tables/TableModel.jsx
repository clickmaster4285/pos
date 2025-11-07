'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import { useCreateTableMutation } from '@/features/tableApi';

export default function TableModel({
  open = false,
  onOpenChange = () => {},
  waiters = [],
  onCreated = () => {}, // callback with created table doc
}) {
  const [form, setForm] = useState({
    name: '',
    seats: '4',
    description: '',
    waiterId: '',
  });

  const [createTable, { isLoading: isCreating }] = useCreateTableMutation();

  // Reset form whenever the dialog opens
  useEffect(() => {
    if (open) {
      setForm({ name: '', seats: '4', description: '', waiterId: '' });
    }
  }, [open]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    const name = form.name.trim();
    const seats = Math.max(1, Number(form.seats) || 1);

    if (!name) return toast.warning('Enter table name');
    if (!form.waiterId) return toast.warning('Select a waiter');

    try {
      const payload = {
        name,
        seats,
        waiterId: form.waiterId,
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
      };

      const created = await createTable(payload).unwrap();
      const createdDoc = created?.data ?? created;

      onCreated(createdDoc); // notify parent to refetch/select, then close
    } catch (err) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        'Failed to create table';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Table</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Table Name */}
          <div>
            <Label>Table Name</Label>
            <Input
              placeholder="e.g., Table 6"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>

          {/* Seats / Chairs */}
          <div>
            <Label>Seats / Chairs</Label>
            <Input
              type="number"
              min={1}
              value={form.seats}
              onChange={(e) => setField('seats', e.target.value)}
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <Label>
              Description{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              placeholder="e.g., Near window / VIP corner"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          {/* Assign Waiter (REQUIRED) */}
          <div>
            <Label>
              Assign Waiter <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.waiterId}
              onValueChange={(v) => setField('waiterId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a waiter" />
              </SelectTrigger>
              <SelectContent>
                {waiters.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || !form.waiterId || !form.name.trim()}
            >
              {isCreating ? 'Creating…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
