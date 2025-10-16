'use client';

import * as React from 'react';
import { useGetShipmentByIdQuery } from '@/features/shipmentsApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, mapRawStatusToNormalized } from './shipmentUtils';

export function TrackModal({ id, onOpenChange }) {
  const open = !!id;
  const { data, isFetching } = useGetShipmentByIdQuery(id, { skip: !open });
  const shipment = data?.data || data || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tracking — {shipment?.awb || ''}</DialogTitle>
        </DialogHeader>

        {!shipment ? (
          <div className="text-sm text-muted-foreground">
            {isFetching ? 'Loading...' : 'Not found'}
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="text-sm">
                Courier:{' '}
                <span className="font-medium">{shipment.courierName}</span>
              </div>
              <div className="text-sm">
                Recipient:{' '}
                <span className="font-medium">{shipment.recipientName}</span>
              </div>
              <div className="text-sm flex items-center gap-2">
                Status:
                <Badge className="rounded-md">
                  {shipment.statusNormalized ||
                    mapRawStatusToNormalized(shipment.statusRaw)}
                </Badge>
               
              </div>
            </div>

            <div className="mt-4">
              <ol className="relative border-l pl-4">
                {(shipment.checkpoints || []).map((cp, idx) => (
                  <li key={idx} className="mb-4 ml-2">
                    <div
                      className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <div className="text-sm font-medium">
                      {cp.description || cp.rawStatus}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(cp.ts)} — {cp.rawStatus}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
