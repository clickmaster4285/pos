'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDeleteAddressMutation } from '@/features/addressApi';
import { toast } from 'sonner';

export default function DeleteAddressDialog({
  open,
  onOpenChange,
  address, // pass the address object to delete
  onDeleted,
}) {
  const [deleteAddress, { isLoading }] = useDeleteAddressMutation();

  const handleDelete = async () => {
    try {
      const id = address?._id || address?.id;
      await deleteAddress(id).unwrap();
      toast.success('Address deleted');
      onDeleted?.(id);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || 'Failed to delete address');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete address</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will remove{' '}
          <span className="font-medium">{address?.fullName}</span>’s shipping
          address. This action cannot be undone.
        </p>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
