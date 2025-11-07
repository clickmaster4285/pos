// ShippingAddressPanel.jsx
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

import { useGetAddressesQuery } from '@/features/addressApi';
import AddressUpsertDialog from './AddressUpsertDialog';
import DeleteAddressDialog from './DeleteAddressDialog';

export default function ShippingAddressPanel({
  values,
  errors,
  update, // (patch) => void
  isAddressRequired, // ← true for Delivery/Online
}) {
  const { data: addresses = [] } = useGetAddressesQuery(undefined, {
    skip: !isAddressRequired,
  });

  const [openAddrCreate, setOpenAddrCreate] = useState(false);
  const [openAddrEdit, setOpenAddrEdit] = useState(false);
  const [openAddrDelete, setOpenAddrDelete] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState(null);

  // pick default when address is required
  useEffect(() => {
    if (!isAddressRequired) return;
    if (!values.shippingAddressId && addresses.length) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def?._id) update({ shippingAddressId: def._id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddressRequired, addresses, values.shippingAddressId]);

  if (!isAddressRequired) return null;

  return (
    <div className="grid gap-2">
      <Label>Shipping Address</Label>

      <div className="min-w-0">
        <Select
          value={values.shippingAddressId || undefined}
          onValueChange={(v) => {
            const found = addresses.find((a) => a._id === v) || null;
            setSelectedAddr(found);
            update({ shippingAddressId: v });
          }}
        >
          <SelectTrigger
            className={`h-9 w-full min-w-0 ${
              errors.shippingAddressId ? 'border-destructive' : ''
            }`}
            aria-invalid={!!errors.shippingAddressId}
            title={(() => {
              const a = addresses.find(
                (x) => x._id === values.shippingAddressId
              );
              return a
                ? `${a.fullName} — ${a.addressLine1}, ${a.city}${
                    a.isDefault ? ' (default)' : ''
                  }`
                : undefined;
            })()}
          >
            <div className="truncate">
              <SelectValue placeholder="Choose shipping address" />
            </div>
          </SelectTrigger>

          <SelectContent className="max-h-72 overflow-y-auto">
            {addresses.map((a) => (
              <SelectItem key={a._id} value={a._id} className="max-w-full">
                <span
                  className="block max-w-full truncate"
                  title={`${a.fullName} — ${a.addressLine1}, ${a.city}${
                    a.isDefault ? ' (default)' : ''
                  }`}
                >
                  {a.fullName} — {a.addressLine1}, {a.city}
                  {a.isDefault ? ' (default)' : ''}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.shippingAddressId ? (
          <p className="text-xs text-destructive mt-1">
            {errors.shippingAddressId}
          </p>
        ) : null}
      </div>

      {/* Address actions */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => setOpenAddrCreate(true)}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!values.shippingAddressId}
          onClick={() => {
            const curr =
              addresses.find((a) => a._id === values.shippingAddressId) || null;
            setSelectedAddr(curr);
            setOpenAddrEdit(true);
          }}
        >
          Edit
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-2"
          disabled={!values.shippingAddressId}
          onClick={() => {
            const curr =
              addresses.find((a) => a._id === values.shippingAddressId) || null;
            setSelectedAddr(curr);
            setOpenAddrDelete(true);
          }}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      {/* dialogs */}
      <AddressUpsertDialog
        open={openAddrCreate}
        onOpenChange={setOpenAddrCreate}
        mode="create"
        onSaved={(res) => {
          const addr = res?.address || res;
          if (addr?._id) {
            update({ shippingAddressId: addr._id });
            setSelectedAddr(addr);
          }
        }}
      />
      <AddressUpsertDialog
        open={openAddrEdit}
        onOpenChange={setOpenAddrEdit}
        mode="edit"
        initialAddress={selectedAddr}
        onSaved={(res) => {
          const addr = res?.address || res;
          if (addr?._id && values.shippingAddressId === addr._id)
            setSelectedAddr(addr);
        }}
      />
      <DeleteAddressDialog
        open={openAddrDelete}
        onOpenChange={setOpenAddrDelete}
        address={selectedAddr}
        onDeleted={(deletedId) => {
          if (values.shippingAddressId === deletedId) {
            const fresh = addresses.filter((a) => a._id !== deletedId);
            const def = fresh.find((a) => a.isDefault) || fresh[0] || null;
            update({ shippingAddressId: def?._id || '' });
            setSelectedAddr(def);
          }
        }}
      />
    </div>
  );
}
