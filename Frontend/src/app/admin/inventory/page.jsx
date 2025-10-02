'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Search } from 'lucide-react';
import {
  useGetInventoryQuery,
  useUpdateInventoryInfoMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
} from '@/features/inventoryApi';
import { useGetAllVendorsQuery } from '@/features/vendorApi';

// Dynamic imports
const InventoryGrid = dynamic(
  () =>
    import('@/components/inventory/InventoryGrid').then(
      (m) => m.default ?? m.InventoryGrid
    ),
  {
    ssr: false,
    loading: () => <div className="p-4 text-sm">Loading grid…</div>,
  }
);

const InventoryList = dynamic(
  () =>
    import('@/components/inventory/InventoryList').then(
      (m) => m.default ?? m.InventoryList
    ),
  {
    ssr: false,
    loading: () => <div className="p-4 text-sm">Loading list…</div>,
  }
);

const CreateInventoryModal = dynamic(
  () =>
    import('@/components/inventory/CreateInventoryModal').then(
      (m) => m.default ?? m.CreateInventoryModal
    ),
  { ssr: false, loading: () => null }
);

const EditInfoDialog = dynamic(
  () =>
    import('@/components/inventory/EditInfoDialog').then(
      (m) => m.EditInfoDialog
    ),
  { ssr: false }
);

const EditHistoryDialog = dynamic(
  () => import('@/components/inventory/EditHistoryDialog'),
  { ssr: false }
);

const AddStockPicker = dynamic(
  () => import('@/components/inventory/AddStockPicker'),
  { ssr: false }
);

const AddStockDialog = dynamic(
  () =>
    import('@/components/inventory/AddStockDialog').then(
      (m) => m.AddStockDialog
    ),
  { ssr: false }
);

function toId(v) {
  return v?.id || v?._id;
}

function calcFromVariants(variants) {
  if (!Array.isArray(variants)) return { total: 0, low: 0 };
  let total = 0;
  let low = 0;
  for (const v of variants) {
    total += v.quantity || 0;
    if (v.quantity <= (v.lowStockThreshold || 10)) low += 1;
  }
  return { total, low };
}

function startOfDay(d) {
  const x = new Date(d || Date.now());
  x.setHours(0, 0, 0, 0);
  return x;
}

function datePresets() {
  const today = startOfDay();
  const week = new Date(today);
  week.setDate(today.getDate() - 7);
  const month = new Date(today);
  month.setMonth(today.getMonth() - 1);
  const threeMonth = new Date(today);
  threeMonth.setMonth(today.getMonth() - 3);
  return { today, week, month, threeMonth };
}

function filterItems(items, query, status, datePreset) {
  if (!Array.isArray(items)) return [];
  const { today, week, month, threeMonth } = datePresets();
  let date = null;
  if (datePreset === 'today') date = today;
  else if (datePreset === 'week') date = week;
  else if (datePreset === 'month') date = month;
  else if (datePreset === 'threeMonth') date = threeMonth;

  return items.filter((it) => {
    const q = query.toLowerCase();
    const nameOk = !q || it.itemName.toLowerCase().includes(q);
    const descOk = !q || it.description?.toLowerCase().includes(q);
    const searchOk = nameOk || descOk;

    const { total, low } = calcFromVariants(it.variants);
    const statusOk =
      status === 'all' ||
      (status === 'instock' && total > 0) ||
      (status === 'outofstock' && total === 0) ||
      (status === 'lowstock' && low > 0);

    const dateOk =
      !date ||
      new Date(it.createdAt || it.updatedAt || Date.now()) >= date;

    return searchOk && statusOk && dateOk;
  });
}

export default function InventoryPage() {
  const [view, setView] = useState('list');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [openStockPicker, setOpenStockPicker] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [pickedItem, setPickedItem] = useState(null);
  const [pickedVariant, setPickedVariant] = useState(null);
  const [activeEditItem, setActiveEditItem] = useState(null);
  const [openHistory, setOpenHistory] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);

  const pageSize = 10;

  const { data, isLoading, refetch } = useGetInventoryQuery();
  const { data: vendors = [] } = useGetAllVendorsQuery();
  const [updateInfo] = useUpdateInventoryInfoMutation();
  const [deleteItem] = useDeleteInventoryItemMutation();
  const pickerItems = useMemo(
    () =>
      Array.isArray(data)
        ? data.map((it) => ({
            id: toId(it),
            itemName: it.itemName || '—',
            variants: Array.isArray(it.variants)
              ? it.variants.map((v) => ({
                  id: toId(v),
                  variantName: v.variantName || '—',
                  sku: v.sku || '',
                  quantity: v.quantity || 0,
                }))
              : [],
          }))
        : [],
    [data]
  );

  const filtered = useMemo(
    () => filterItems(data, query, status, datePreset),
    [data, query, status, datePreset]
  );

  const totalPages = Math.ceil((filtered?.length || 0) / pageSize);
  const current = useMemo(
    () =>
      filtered.slice((page - 1) * pageSize, page * pageSize).map((it) => (
        // console.log("teh it in the items are : ",it),
        {
        id: toId(it),
        itemName: it.itemName || '—',
        description: it.description || '—',
        totalCostPrice: it.totalCostPrice || '—',
        totalPrice: it.totalPrice || '—',
        location: it.location || '—',
        variants: Array.isArray(it.variants)
          ? it.variants.map((v) => ({
              id: toId(v),
              variantName: v.variantName || '—',
              sku: v.sku || '',
              quantity: v.quantity || 0,
              incomingQuantity: v.incomingQuantity || 0,
              price: v.price || 0,
              costPrice: v.costPrice || 0,
              lowStockThreshold: v.lowStockThreshold || 10,
            }))
          : [],
        vendorId: it.vendor,
        totalQuantity: it.quantity || 0,
        vendorName: it.vendor?.name || '—',
        createdAt: it.createdAt || '',
        updatedAt: it.updatedAt || '',
      })),
    [filtered, page]
  );

  const onEditInfo = (item) => {
    setActiveEditItem(item);
  };

  const onEditViaHistory = (item) => {
    setActiveHistoryItem(item);
    setOpenHistory(true);
  };

  const onDeleteItem = async (item) => {
    try {
      await deleteItem(item.id || item._id).unwrap();
      await refetch();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleEditClose = async (res) => {
    setActiveEditItem(null);
    if (res?.refreshed) await refetch();
  };

  const handleCreated = async () => {
    await refetch();
  };

  const handlePickerPick = ({ item, variant }) => {
    setPickedItem(item);
    setPickedVariant(variant);
    setOpenAddDialog(true);
    setOpenStockPicker(false);
  };

  const handleAddDialogClose = async (res) => {
    setOpenAddDialog(false);
    setPickedItem(null);
    setPickedVariant(null);
    if (res?.refreshed) await refetch();
  };

  return (
    <main className="p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpenStockPicker(true)}
            disabled={isLoading}
          >
            Add Stock
          </Button>
          <Button onClick={() => setOpenCreate(true)} disabled={isLoading}>
            Create Item
          </Button>
        </div>
      </header>

      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            className="h-10 w-full rounded-lg border border-gray-300 pl-10 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            placeholder="Search inventory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="instock">In Stock</option>
            <option value="outofstock">Out of Stock</option>
            <option value="lowstock">Low Stock</option>
          </select>
          <select
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="threeMonth">Last 3 Months</option>
          </select>
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('list')}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div>
        {InventoryGrid && InventoryList ? (
          view === 'grid' ? (
            <InventoryGrid
              items={current}
              onStockAdded={handleCreated}
              onEditInfo={onEditInfo}
              onEditHistory={onEditViaHistory}
              onDeleteItem={onDeleteItem}
            />
          ) : (
            <InventoryList
              items={current}
              onStockAdded={handleCreated}
              onEditInfo={onEditInfo}
              onEditHistory={onEditViaHistory}
              onDeleteItem={onDeleteItem}
            />
          )
        ) : (
          <div className="p-4 text-sm text-amber-700">
            Component failed to load. Check exports/paths.
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {CreateInventoryModal && (
        <CreateInventoryModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={handleCreated}
          vendors={vendors}
        />
      )}

      {activeEditItem && (
        <EditInfoDialog
          open
          item={activeEditItem}
          vendors={vendors}
          onClose={handleEditClose}
        />
      )}

      {openHistory && activeHistoryItem && (
        <EditHistoryDialog
          open={openHistory}
          item={activeHistoryItem}
          onClose={async (res) => {
            setOpenHistory(false);
            setActiveHistoryItem(null);
            if (res?.refreshed) await refetch();
          }}
        />
      )}

      {AddStockPicker && (
        <AddStockPicker
          open={openStockPicker}
          onOpenChange={setOpenStockPicker}
          items={pickerItems}
          onPick={handlePickerPick}
        />
      )}

      {pickedItem && (
        <AddStockDialog
          open={openAddDialog}
          onClose={handleAddDialogClose}
          item={pickedItem}
          initialVariant={pickedVariant || undefined}
        />
      )}
    </main>
  );
}