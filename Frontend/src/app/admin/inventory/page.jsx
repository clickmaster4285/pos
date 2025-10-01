'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import {
  useGetInventoryQuery,
  useUpdateInventoryInfoMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
} from '@/features/inventoryApi';
import { useGetAllVendorsQuery } from '@/features/vendorApi';

/** ---- dynamic children ---- */
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
  () =>
    import('@/components/inventory/EditInfoDialog').then(
      (m) => m.EditHistoryDialog
    ),
  { ssr: false }
);
// at the top with the other dynamics:
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
/* ---------------- helpers ---------------- */
const toId = (x) => {
  try {
    return String(x);
  } catch {
    return '';
  }
};

const calcFromVariants = (variants = []) => {
  let qty = 0,
    incoming = 0,
    totalPrice = 0,
    totalCost = 0;
  for (const v of variants) {
    const q = Number(v.quantity || 0);
    const iq = Number(v.incomingQuantity || 0);
    const price = Number(v.price || 0);
    const cost = Number(v.costPrice || 0);
    qty += q;
    incoming += iq;
    totalPrice += q * price;
    totalCost += q * cost;
  }
  return { qty, incoming, totalPrice, totalCost };
};

function mapInventory(rec) {
  const variants = Array.isArray(rec.variants)
    ? rec.variants.map((v) => ({
        id: toId(v._id || v.id),
        variantName: v.variantName || '—',
        sku: v.sku || '',
        incomingQuantity: Number(v.incomingQuantity || 0),
        quantity: Number(v.quantity || 0),
        returnUnder: Number(v.returnUnder || 0),
        price: Number(v.price || 0),
        costPrice: Number(v.costPrice || 0),
        attributes: v.attributes || {},
        totalOrdered: Number(v.totalOrdered || 0),
        totalReturned: Number(v.totalReturned || 0),
        totalAdjusted: Number(v.totalAdjusted || 0),
        lowStockThreshold: Number(v.lowStockThreshold ?? 0),
        lastOrderedDate: v.lastOrderedDate || null,
        createdAt: v.createdAt || null,
        updatedAt: v.updatedAt || null,
      }))
    : [];

  const agg = calcFromVariants(variants);

  return {
    id: toId(rec._id || rec.id),
    companyId: rec.companyId || '',
    itemName: rec.itemName || '—',
    itemType: rec.itemType || 'Part',
    description: rec.description || '',
    totalVariants:
      typeof rec.totalVariants === 'number'
        ? rec.totalVariants
        : variants.length,
    variants,
    quantity: Number(rec.quantity ?? agg.qty),
    incomingQuantity: Number(rec.incomingQuantity ?? agg.incoming),
    totalPrice: Number(rec.totalPrice ?? agg.totalPrice),
    totalCostPrice: Number(rec.totalCostPrice ?? agg.totalCost),
    vendor: rec.vendor || '—',
    location: rec.location || '—',
    createdBy: rec.createdBy || '',
    isActive: !!rec.isActive,
    status: rec.isActive ? 'Active' : 'Inactive',
    history: Array.isArray(rec.history) ? rec.history : [],
    deleted: !!rec.deleted,
    createdAt: rec.createdAt || new Date().toISOString(),
    updatedAt: rec.updatedAt || new Date().toISOString(),
  };
}

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const rangeFor = (preset) => {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last7': {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay(now) };
    }
    case 'last30': {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay(now) };
    }
    default:
      return null;
  }
};

/* ---------------- page ---------------- */
export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [openCreate, setOpenCreate] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openStockPicker, setOpenStockPicker] = useState(false);
  const [activeEditItem, setActiveEditItem] = useState(null);
  const [pickedItem, setPickedItem] = useState(null);
  const [pickedVariant, setPickedVariant] = useState(null);

  const pickerItems = useMemo(
    () =>
      (items || []).map((it) => ({
        id: it.id,
        itemName: it.itemName,
        itemType: it.itemType,
        vendor:
          typeof it.vendor === 'string' ? it.vendor : it.vendor?.name ?? '',
        location: it.location,
        variants: (it.variants || []).map((v) => ({
          id: v.id,
          variantName: v.variantName,
          sku: v.sku,
          quantity: v.quantity,
          incomingQuantity: v.incomingQuantity,
          price: v.price,
          costPrice: v.costPrice,
          returnUnder: v.returnUnder,
          attributes: v.attributes,
        })),
      })),
    [items]
  );
  const handlePickerPick = ({ item, variant }) => {
    setPickedItem(item);
    setPickedVariant(variant || null);
    setOpenStockPicker(false);
    setOpenAddDialog(true);
  };

  const handleAddDialogClose = async (res) => {
    setOpenAddDialog(false);
    setPickedItem(null);
    setPickedVariant(null);
    if (res?.refreshed) await refetch();
  };
  // NEW: history edit state
  const [openHistory, setOpenHistory] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);

  const pageSize = 10;

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetInventoryQuery();
  const { data: vendors = [] } = useGetAllVendorsQuery();

  useEffect(() => {
    setItems(
      Array.isArray(data)
        ? data.filter((d) => !d.deleted).map(mapInventory)
        : []
    );
  }, [data]);

  const [updateInfo] = useUpdateInventoryInfoMutation();
  const [updateItem] = useUpdateInventoryItemMutation();
  const [deleteItem] = useDeleteInventoryItemMutation();

  const onEditInfo = (record) => setActiveEditItem(record);

  const onEditViaHistory = (record) => {
    setActiveHistoryItem(record);
    setOpenHistory(true);
  };

  const onDeleteItem = async (record) => {
    try {
      if (!window.confirm(`Delete "${record.itemName}"? (soft delete)`)) return;
      await deleteItem(record.id).unwrap();
      await refetch();
      alert('Deleted.');
    } catch (e) {
      alert(e?.data?.message || e?.message || 'Failed to delete');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const range = rangeFor(datePreset);
    return items.filter((it) => {
      const inVariants = it.variants.some((v) =>
        [v.variantName, v.sku].some((x) =>
          String(x || '')
            .toLowerCase()
            .includes(q)
        )
      );
      const textOk =
        !q ||
        [
          it.itemName,
          it.itemType,
          it.location,
          it.vendor,
          it.status,
          it.companyId,
        ].some((x) =>
          String(x || '')
            .toLowerCase()
            .includes(q)
        ) ||
        inVariants;

      const statusOk =
        status === 'all' ||
        (status === 'active' && it.isActive) ||
        (status === 'inactive' && !it.isActive);

      const createdAt = it.createdAt ? new Date(it.createdAt) : null;
      const dateOk =
        !range ||
        (createdAt && createdAt >= range.from && createdAt <= range.to);

      return textOk && statusOk && dateOk;
    });
  }, [items, query, status, datePreset]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);
  const start = (page - 1) * pageSize;
  const current = filtered.slice(start, start + pageSize);

  const handleCreated = async () => {
    await refetch();
  };
  const handleEditClose = async (res) => {
    setActiveEditItem(null);
    if (res?.refreshed) await refetch();
  };

  if (isLoading)
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading inventory…
      </div>
    );
  if (isError)
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load inventory
        {error?.data?.error ? `: ${error.data.error}` : ''}.
      </div>
    );

  return (
    <main className="mx-auto max-w-full p-6">
      {/* header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="mt-3 text-3xl font-semibold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">
            Items, variants, stock levels, vendors, and locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenStockPicker(true)}>Add Stock</Button>
          <Button onClick={() => setOpenCreate(true)}>New Item</Button>
          {/* <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button> */}
        </div>
      </div>

      {/* toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full">
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search by item, type, variant, SKU, vendor, location, status"
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring"
              value={datePreset}
              onChange={(e) => {
                setPage(1);
                setDatePreset(e.target.value);
              }}
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
            </select>

            <select
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {(status !== 'all' || datePreset !== 'all' || query) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setStatus('all');
                  setDatePreset('all');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {total} result{total === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* content */}
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

        {/* pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {total === 0 ? 0 : start + 1}-
            {Math.min(start + pageSize, total)} of {total}
          </p>
          <nav className="flex items-center gap-1" aria-label="Pagination">
            <button
              className="h-8 rounded-md border bg-secondary px-2 text-xs text-secondary-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const windowStart = Math.max(
                1,
                Math.min(page - 2, totalPages - 4)
              );
              const pageNumber = windowStart + i;
              if (pageNumber > totalPages) return null;
              const active = pageNumber === page;
              return (
                <button
                  key={pageNumber}
                  className={`h-8 w-8 rounded-md text-xs ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'border bg-background text-foreground'
                  }`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              className="h-8 rounded-md border bg-secondary px-2 text-xs text-secondary-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      {/* create modal */}
      {CreateInventoryModal && (
        <CreateInventoryModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={handleCreated}
          vendors={vendors}
        />
      )}

      {/* edit info dialog */}
      {activeEditItem && (
        <EditInfoDialog
          open
          item={activeEditItem}
          vendors={vendors}
          onClose={handleEditClose}
        />
      )}

      {/* edit history dialog */}
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
      {/* Quantity + details dialog; seeded with pickedVariant if present */}
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
