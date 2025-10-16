'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';

import { useCreateCourierMutation } from '@/features/couriersApi';

export function CreateCourierModal({
  open,
  onOpenChange,

  defaultEnvironment = 'Sandbox',
  onCreated,
}) {
  const [form, setForm] = React.useState({
    name: '',
    code: '', // optional: server will derive if empty
    environment: defaultEnvironment,
    status: 'Not Connected', // client-only; server sets when reviving, not used on create
    maxWeightKg: '',
    priority: '',
    supportsCOD: true,
    domesticOnly: true,
  });

  const [createCourier, { isLoading }] = useCreateCourierMutation();

  React.useEffect(() => {
    if (open) setForm((f) => ({ ...f, environment: defaultEnvironment }));
  }, [defaultEnvironment, open]);

  const reset = () =>
    setForm({
      name: '',
      code: '',
      environment: defaultEnvironment,
      status: 'Not Connected',
      maxWeightKg: '',
      priority: '',
      supportsCOD: true,
      domesticOnly: false,
    });

  const numOrUndef = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleCreate = async () => {
    const name = form.name.trim();
    const code = (form.code || '').trim().toUpperCase();

    if (!name) {
      window.alert('Courier name is required.');
      return;
    }

    const payload = {
      name,
      environment: form.environment || 'Sandbox',
      supportsCOD: !!form.supportsCOD,
      domesticOnly: !!form.domesticOnly,
      // status is not part of create on server; omit it
      ...(numOrUndef(form.maxWeightKg) !== undefined && {
        maxWeightKg: numOrUndef(form.maxWeightKg),
      }),
      ...(numOrUndef(form.priority) !== undefined && {
        priority: numOrUndef(form.priority),
      }),
      // optional code: server will derive from name if omitted
      ...(code ? { code } : {}),
      // harmless to include; server ignores if not modeled
    };

    try {
      const created = await createCourier(payload).unwrap();
      onCreated?.(created);
      onOpenChange(false);
      reset();
    } catch (e) {
      const msg =
        e?.data?.error ||
        e?.error ||
        'Failed to create courier. Please verify fields and try again.';
      window.alert(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && onOpenChange(v)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Courier</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="courier-name">Courier Name</Label>
            <Input
              id="courier-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. TCS, DHL, FedEx"
              disabled={isLoading}
            />
          </div>

          {/* Environment + Status in same row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Environment */}
            <div className="grid gap-2">
              <Label>Environment</Label>
              <Select
                value={form.environment}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, environment: v }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full" aria-label="Environment">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sandbox">Sandbox</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            {/* <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Connected">Connected</SelectItem>
                  <SelectItem value="Not Connected">Not Connected</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>

          {/* Max Weight & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="max-weight">Max Weight (kg)</Label>
              <Input
                id="max-weight"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.maxWeightKg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxWeightKg: e.target.value }))
                }
                placeholder="e.g. 30"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value }))
                }
                placeholder="e.g. 100"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="supportsCOD" className="font-normal">
                Supports COD
              </Label>
              <Switch
                id="supportsCOD"
                checked={form.supportsCOD}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, supportsCOD: v }))
                }
                disabled={isLoading}
                aria-label="Supports COD"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="domesticOnly" className="font-normal">
                Domestic Only
              </Label>
              <Switch
                id="domesticOnly"
                checked={form.domesticOnly}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, domesticOnly: v }))
                }
                disabled={isLoading}
                aria-label="Domestic Only"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
