'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCreateOrderMutation } from '@/features/orderApi';
import { toast } from 'sonner';
import OrderForm from '@/components/orders/order-form';

export default function CreateNewOrderInBill({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const handleSubmit = async (payload) => {
    try {
      const created = await createOrder(payload).unwrap();
      const orderObj = created?.data || created;
      toast.success('Order created');
      await onCreated?.(orderObj);
      setOpen(false);
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to create order'
      );
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" />
        Create New Order
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/40">
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Fill in the order details and submit.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable form area */}
          <div className="overflow-y-auto px-6 py-4">
            <OrderForm onSubmit={handleSubmit} loading={isLoading} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
