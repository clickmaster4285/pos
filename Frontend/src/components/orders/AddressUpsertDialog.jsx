'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from '@/features/addressApi';
import { toast } from 'sonner';

export default function AddressUpsertDialog({
  open,
  onOpenChange,
  // mode: 'create' | 'edit'
  mode = 'create',
  // pass the address when editing
  initialAddress = null,
  // callback(address) after successful save
  onSaved,
}) {
  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const isLoading = isCreating || isUpdating;

  const blank = useMemo(
    () => ({
      fullName: '',
      phoneNumber: '',
      alternatePhone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
      addressType: 'Home',
      isDefault: false,
    }),
    []
  );

  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialAddress) {
        // prefill with existing values
        setForm({
          fullName: initialAddress.fullName || '',
          phoneNumber: initialAddress.phoneNumber || '',
          alternatePhone: initialAddress.alternatePhone || '',
          addressLine1: initialAddress.addressLine1 || '',
          addressLine2: initialAddress.addressLine2 || '',
          city: initialAddress.city || '',
          state: initialAddress.state || '',
          postalCode: initialAddress.postalCode || '',
          country: initialAddress.country || 'Pakistan',
          addressType: initialAddress.addressType || 'Home',
          isDefault: !!initialAddress.isDefault,
        });
      } else {
        setForm(blank);
      }
    }
  }, [open, mode, initialAddress, blank]);

  const update = (patch) => setForm((v) => ({ ...v, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        addressLine1: form.addressLine1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
      };

      let saved;
      if (
        mode === 'edit' &&
        initialAddress &&
        (initialAddress._id || initialAddress.id)
      ) {
        const id = initialAddress._id || initialAddress.id;
        saved = await updateAddress({ id, ...payload }).unwrap();
        toast.success('Address updated');
      } else {
        saved = await createAddress(payload).unwrap();
        toast.success('Address added');
      }

      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || 'Failed to save address');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit address' : 'Add new address'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Full name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                required
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => update({ phoneNumber: e.target.value })}
                required
                className="h-9"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Alternate phone</Label>
              <Input
                value={form.alternatePhone}
                onChange={(e) => update({ alternatePhone: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Address type</Label>
              <Select
                value={form.addressType}
                onValueChange={(v) => update({ addressType: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Address line 1</Label>
            <Input
              value={form.addressLine1}
              onChange={(e) => update({ addressLine1: e.target.value })}
              required
              className="h-9"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Address line 2</Label>
            <Input
              value={form.addressLine2}
              onChange={(e) => update({ addressLine2: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => update({ city: e.target.value })}
                required
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => update({ state: e.target.value })}
                required
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Postal code</Label>
              <Input
                value={form.postalCode}
                onChange={(e) => update({ postalCode: e.target.value })}
                required
                className="h-9"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => update({ country: e.target.value })}
                required
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Default address?</Label>
              <Select
                value={String(form.isDefault)}
                onValueChange={(v) => update({ isDefault: v === 'true' })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? mode === 'edit'
                  ? 'Updating…'
                  : 'Saving…'
                : mode === 'edit'
                ? 'Update'
                : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
