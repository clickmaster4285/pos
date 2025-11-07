'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table as TableIcon, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

import TableGrid from './TableGrid';
import TableDetailsPanel from './TableDetailsPanel';
import TableModel from '@/components/tables/TableModel';

import { useListTablesQuery } from '@/features/tableApi';
import { useGetAllStaffQuery } from '@/features/staffApi';
import { orderApi } from '@/features/orderApi';

export const STATE_META = {
  available: {
    label: 'Available',
    tint: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  occupied: {
    label: 'Order In Progress',
    tint: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
  },
  awaiting_payment: {
    label: 'Awaiting Payment',
    tint: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  reserved: {
    label: 'Reserved',
    tint: 'bg-primary/10 text-primary/70',
    dot: 'bg-primary/50',
  },
};

const getId = (t) => t?._id || t?.id;

export default function TablesBoard() {
  const { data, isLoading, isError, refetch } = useListTablesQuery();

  const { data: staffData } = useGetAllStaffQuery();
  const waiters = useMemo(() => {
    const arr = Array.isArray(staffData) ? staffData : staffData?.data || [];
    return arr
      .filter((s) => String(s?.subRole || '').toLowerCase() === 'waiter')
      .map((s) => ({
        id: String(s?._id || s?.id),
        name: s?.fullName || s?.name || 'Unnamed',
      }));
  }, [staffData]);

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

  // Normalize tables
  const apiTables = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  // Selection
  const [selectedTableId, setSelectedTableId] = useState(null);
  useEffect(() => {
    if (!selectedTableId && apiTables.length)
      setSelectedTableId(getId(apiTables[0]));
  }, [apiTables, selectedTableId]);
  const selectedTable = useMemo(
    () => apiTables.find((t) => getId(t) === selectedTableId) || null,
    [apiTables, selectedTableId]
  );

  // Buckets
  const byState = useMemo(() => {
    const group = {
      all: apiTables,
      available: [],
      occupied: [],
      reserved: [],
      awaiting_payment: [],
    };
    for (const t of apiTables) if (group[t.state]) group[t.state].push(t);
    return group;
  }, [apiTables]);

  // Modal control
  const [createOpen, setCreateOpen] = useState(false);

  // When a table is created inside TableModel
  const handleCreated = (createdDoc) => {
    const createdId = createdDoc?._id || createdDoc?.id;
    if (createdId) setSelectedTableId(createdId);
    toast.success(`Table "${createdDoc?.name || 'New Table'}" created`);
    refetch();
    setCreateOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-foreground">
            Tables and Reservations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your tables, assignments, and reservations.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Table
        </Button>
      </div>

      {/* Board + Details */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Board */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TableIcon className="h-5 w-5" /> Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground p-4">
                  Loading tables…
                </div>
              ) : isError ? (
                <div className="text-sm text-red-600 p-4">
                  Failed to load tables
                </div>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="available">Available</TabsTrigger>
                    <TabsTrigger value="occupied">Occupied</TabsTrigger>
                    <TabsTrigger value="reserved">Reserved</TabsTrigger>
                    <TabsTrigger value="awaiting_payment">
                      Awaiting Payment
                    </TabsTrigger>
                  </TabsList>

                  {[
                    'all',
                    'available',
                    'occupied',
                    'reserved',
                    'awaiting_payment',
                  ].map((k) => (
                    <TabsContent key={k} value={k}>
                      <TableGrid
                        tables={byState[k]}
                        selectedId={selectedTableId}
                        onSelect={setSelectedTableId}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Details */}
        <div className="col-span-12 lg:col-span-5">
          <TableDetailsPanel
            selectedTableId={selectedTableId}
            table={selectedTable}
            tables={apiTables}
            setTables={() => {}}
            seatings={[]}
            setSeatings={() => {}}
            orders={[]}
            setOrders={() => {}}
            demoMode={false}
          />
        </div>
      </div>

      {/* Create Table Modal (handles its own create logic) */}
      <TableModel
        open={createOpen}
        onOpenChange={setCreateOpen}
        waiters={waiters}
        onCreated={handleCreated}
      />
    </div>
  );
}
