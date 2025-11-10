'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CookingPot } from 'lucide-react';
import { toast } from 'sonner';
import { orderApi } from '@/features/orderApi';

import { useActiveDineInOrderByTableQuery } from '@/features/tableApi';
import { timeAgo } from './utils';
import { useSelector } from 'react-redux';

export default function TableOrderSection({ tableId, demoMode }) {
  const {
    data: activeOrder,
    isFetching: fetchingOrder,
    isError: orderError,
    refetch,
  } = useActiveDineInOrderByTableQuery(tableId, {
    skip: !tableId,
  });



  // Refetch tables whenever ANY createOrder mutation succeeds (from anywhere)
  const lastCreateIdRef = useRef(null);
  const createOrderFulfilled = useSelector((state) => {
    const bucket = state[orderApi.reducerPath]?.mutations ?? {};
    for (const k in bucket) {
      const m = bucket[k];
      if (m?.endpointName === 'createOrder' && m?.status === 'fulfilled') {
        return { requestId: m?.requestId ?? k, data: m?.data };
      }
    }
    return null;
  });
  useEffect(() => {
    if (!createOrderFulfilled) return;
    const { requestId } = createOrderFulfilled;
    if (requestId && requestId !== lastCreateIdRef.current) {
      lastCreateIdRef.current = requestId;
      refetch();
    }
  }, [createOrderFulfilled, refetch]);

  //---------------------
  const currency = (n) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

  const disabledMsg = () =>
    toast.info('Wire this action to your API mutations');
  const handleCreateOrder = () => (demoMode ? disabledMsg() : disabledMsg());

  return (
    <Card className="mt-4 border-dashed">
      {fetchingOrder ? (
        <div className="text-sm text-muted-foreground px-3 py-2">
          Loading order…
        </div>
      ) : orderError ? (
        <div className="text-sm text-red-600 px-3 py-2">
          Failed to load order
        </div>
      ) : !activeOrder ? (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-sm text-muted-foreground">No active order</div>
          <Button size="sm" onClick={handleCreateOrder}>
            New Dine-In Order
          </Button>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <CardTitle className="text-base flex items-center gap-2 mb-3">
                <CookingPot className="h-4 w-4" /> Order Details
              </CardTitle>

              <div className="font-medium">
                <span>Order No: </span>
                {activeOrder.orderNo || 'Order'}
              </div>
              {activeOrder.createdAt && (
                <div className="text-muted-foreground text-xs">
                  Created {timeAgo(activeOrder.createdAt)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {activeOrder.orderStatus || 'pending'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            {(activeOrder.items || []).map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <div className="truncate">
                  <span className="font-medium">{it.name}</span>
                  <span className="text-muted-foreground"> × {it.qty}</span>
                </div>
                <div className="tabular-nums">
                  {currency(it.total ?? (it.price || 0) * (it.qty || 0))}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                {currency(activeOrder.subTotal ?? 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
