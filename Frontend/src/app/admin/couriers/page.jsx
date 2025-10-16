'use client';

import * as React from 'react';
import { useGetShipmentsQuery } from '@/features/shipmentsApi';
import { Toaster, toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { SummaryCard } from '@/components/couriers/SummaryCard';
import { CouriersGrid } from '@/components/couriers/CouriersGrid';
import { ShipmentsTable } from '@/components/couriers/ShipmentsTable';
import { CreateShipmentForm } from '@/components/couriers/CreateShipmentForm';
import { seedCouriers } from '@/components/couriers/shipmentUtils';
//
import { useGetCompanySettingsQuery } from '@/features/settingsApi';

export default function ShipmentsPage() {
  return (
    <>
      <PageInner />
      <Toaster />
    </>
  );
}

function PageInner() {
  const { data } = useGetShipmentsQuery();
  const shipments = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [couriers] = React.useState(seedCouriers);

  const summary = React.useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(
      (s) =>
        (s.statusNormalized || mapRawStatusToNormalized(s.statusRaw)) ===
        'DELIVERED'
    ).length;
    const inTransit = shipments.filter((s) => {
      const norm = s.statusNormalized || mapRawStatusToNormalized(s.statusRaw);
      return norm === 'IN_TRANSIT' || norm === 'OUT_FOR_DELIVERY';
    }).length;
    const codCount = shipments.filter((s) => s?.cod?.enabled).length;
    return { total, delivered, inTransit, codCount };
  }, [shipments]);

  //currency
  const { data: company, isLoading: settingsLoading } =
    useGetCompanySettingsQuery();
  const settingsRaw = company?.invoiceSettings ?? {};
  const currencySymbol =
    settingsRaw?.currency?.symbol ?? company?.currency?.symbol ?? '₨';

  return (
    <main className="min-h-dvh ">
      <div className="mx-auto max-w-full px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              Courier & Shipments Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add couriers, update credentials, and track all your shipments
              from one dashboard.
            </p>
          </div>
          <Button variant="header" onClick={() => setCreateOpen(true)}>
            Create Shipment
          </Button>
        </header>

        {/* Summary */}
        <section className="grid md:grid-cols-4 gap-3 ">
          <SummaryCard title="Total Shipments" value={summary.total} />
          <SummaryCard title="Delivered" value={summary.delivered} />
          <SummaryCard title="In Transit" value={summary.inTransit} />
          <SummaryCard title="COD Shipments" value={summary.codCount} />
        </section>

        <section className="space-y-4">
          <Card>
            <CardContent>
              <CouriersGrid />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentsTable currencySymbol={currencySymbol} />
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Create Shipment Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
          </DialogHeader>
          <CreateShipmentForm
            currencySymbol={currencySymbol}
            couriers={couriers}
            onClose={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
