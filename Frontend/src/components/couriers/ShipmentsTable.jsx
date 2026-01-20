'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  useGetShipmentsQuery,
  useUpdateShipmentStatusMutation,
  useCancelShipmentMutation,
  useSoftDeleteShipmentMutation,
  useRestoreShipmentMutation,
} from '@/features/shipmentsApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Pagination from '../ui/Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, PrinterIcon } from 'lucide-react';
//

import { TrackModal } from './TrackModal';
import { printAwbWindow } from './awbUtils';
import { Sheet } from '@/components/ui/sheet';
import { ShipmentDetailsSheet } from './ShipmentDetailsSheet';
import {
  mapRawStatusToNormalized,
  nextStatusesFor,
  formatDateTime,
  normalizedToRaw,
} from './shipmentUtils';

export function ShipmentsTable({ currencySymbol }) {
  const { data, isLoading, isError, refetch } = useGetShipmentsQuery();

  const shipments = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const total = shipments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pagedShipments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return shipments.slice(start, start + pageSize);
  }, [shipments, page, pageSize]);

  // reset to first page when data or page size changes
  useEffect(() => {
    setPage(1);
  }, [shipments, pageSize]);

  const [updateStatus] = useUpdateShipmentStatusMutation();
  const [cancelShipment] = useCancelShipmentMutation();
  const [softDelete] = useSoftDeleteShipmentMutation();
  const [restore] = useRestoreShipmentMutation();

  const [trackingId, setTrackingId] = React.useState(null);

  const handleUpdateStatus = async (shipment, next) => {
    try {
      // send human-ish raw for backend parsing
      await updateStatus({
        id: shipment._id,
        rawStatus: normalizedToRaw(next),
      }).unwrap();

      refetch();
    } catch (e) {
    }
  };

  const handleCancel = async (shipment) => {
    try {
      await cancelShipment(shipment._id).unwrap();

      refetch();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSoftDelete = async (shipment) => {
    try {
      await softDelete(shipment._id).unwrap();

      refetch();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRestore = async (shipment) => {
    try {
      await restore(shipment._id).unwrap();
      refetch();
    } catch (e) {
      console.info(`({
        title: 'Restore failed',
        description: e?.data?.message || 'Unable to restore',
      })`);
    }
  };
  // inside ShipmentsTable component:
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsShipment, setDetailsShipment] = React.useState(null);

  const openDetails = (s) => {
    setDetailsShipment(s);
    setDetailsOpen(true);
  };

  if (isLoading)
    return (
      <div className="text-sm text-muted-foreground">Loading shipments…</div>
    );
  if (isError) {
    return (
      <div className="text-sm text-red-600">
        Failed to load shipments.
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="ml-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>AWB</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>COD</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedShipments.map((s) => {
              const normalized =
                s.statusNormalized || mapRawStatusToNormalized(s.statusRaw);
              const nexts = nextStatusesFor(normalized);
              return (
                <TableRow key={s._id || s.id}>
                  <TableCell
                    onClick={() => openDetails(s)}
                    className="font-medium"
                  >
                    {s.awb}
                  </TableCell>
                  <TableCell onClick={() => openDetails(s)}>
                    {s.courierName || s.courierCode}
                  </TableCell>
                  <TableCell onClick={() => openDetails(s)}>
                    {s.recipientName}
                  </TableCell>
                  <TableCell onClick={() => openDetails(s)}>
                    {s?.cod?.enabled
                      ? `Yes (${Number(s?.cod?.amount ?? 0).toFixed(
                          2
                        )} ${' '}${currencySymbol}) `
                      : 'No'}
                  </TableCell>
                  <TableCell onClick={() => openDetails(s)}>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-md">{normalized}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {s.statusRaw}
                      </span>
                      {s?.deleted ? (
                        <Badge variant="destructive" className="rounded-md">
                          Deleted
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => openDetails(s)}>
                    {formatDateTime(s.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setTrackingId(s._id)}
                        aria-label="Track"
                      >
                        Track
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          printAwbWindow(
                            s.awb,
                            s.courierName,
                            s.recipientName,
                            s.cod,
                            formatDateTime(s.createdAt),
                            {
                              currencySymbol, // from your prop
                              fromAddress: s.from_wareHouse, // if you store full address, pass that string
                              toAddress: s.toAddress,
                              toCity: s.toCity,
                              serviceLevel: s.serviceLevel,
                              logoUrl: '/logo.svg', // or leave empty
                            }
                          )
                        }
                        aria-label="Print AWB"
                      >
                        <PrinterIcon className="h-4 w-4 mr-1" />
                        Print AWB
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Update Status"
                          >
                            Update Status
                            <ChevronDownIcon className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {nexts.length === 0 ? (
                            <DropdownMenuItem disabled>
                              No transitions
                            </DropdownMenuItem>
                          ) : (
                            nexts.map((ns) => (
                              <DropdownMenuItem
                                key={ns}
                                onClick={() => handleUpdateStatus(s, ns)}
                              >
                                {ns}
                              </DropdownMenuItem>
                            ))
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleCancel(s)}
                          >
                            Cancel Shipment
                          </DropdownMenuItem>
                          {!s?.deleted ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleSoftDelete(s)}
                            >
                              Move to Trash
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRestore(s)}>
                              Restore
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, total)} of {total} shipments
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </div>
      </div>
      <ShipmentDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        shipment={detailsShipment}
        currencySymbol={currencySymbol}
      />
      <TrackModal id={trackingId} onOpenChange={() => setTrackingId(null)} />
    </>
  );
}
