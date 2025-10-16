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
import Pagination from '@/components/ui/Pagination';
import { useGetAllVendorsQuery } from '@/features/vendorApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGetCompanySettingsQuery } from '@/features/settingsApi';
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

const DatePickerDialog = dynamic(
  () =>
    import('@/components/DatePickerDialog/DatePickerDialog').then(
      (m) => m.default ?? m.DatePickerDialog
    ),
  { ssr: false, loading: () => null }
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
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function filterItems(items, query, status, fromDate, toDate) {
  if (!Array.isArray(items)) return [];
  const from = fromDate ? startOfDay(new Date(fromDate)) : null;
  const to = toDate ? endOfDay(new Date(toDate)) : null;

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

    const itemDate = new Date(it.createdAt || it.updatedAt || Date.now());
    let dateOk = true;
    if (from && !to) {
      // Single date: match only items from that exact date
      dateOk = itemDate >= from && itemDate <= endOfDay(fromDate);
    } else {
      // Date range or no dates
      dateOk = (!from || itemDate >= from) && (!to || itemDate <= to);
    }

    return searchOk && statusOk && dateOk;
  });
}

function generatePDF(items, fromDate, toDate) {
  const doc = new jsPDF();
  const config = getPDFConfig();

  setupDocumentHeader(doc, config, fromDate, toDate);
  const tableData = prepareTableData(items);
  renderDataTable(doc, config, tableData);
  renderSummarySection(doc, config, items);

  const fileName = generateFileName(fromDate);
  doc.save(fileName);
}

// Configuration object for consistent styling
function getPDFConfig() {
  return {
    margins: { x: 14, y: 22 },
    fonts: {
      title: 18,
      subtitle: 11,
      body: 12,
    },
    colors: {
      primary: [41, 128, 185],
      white: [255, 255, 255],
      text: [44, 62, 80],
      alternateRow: [240, 248, 255],
    },
    spacing: {
      line: 8,
      section: 10,
    },
  };
}

// Document header setup
function setupDocumentHeader(doc, config, fromDate, toDate) {
  const { margins, fonts, colors } = config;

  doc.setFontSize(fonts.title);
  doc.text('Inventory Variants Summary', margins.x, margins.y);

  doc.setFontSize(fonts.subtitle);
  const subtitle = generateSubtitle(fromDate, toDate);
  doc.text(subtitle, margins.x, margins.y + config.spacing.line);
}

// Generate appropriate subtitle based on date filters
function generateSubtitle(fromDate, toDate) {
  const currentDate = new Date().toISOString().slice(0, 10);

  if (fromDate && toDate) {
    return `Date Range: ${fromDate} to ${toDate}`;
  } else if (fromDate && !toDate) {
    return `Date: ${fromDate}`;
  } else if (toDate) {
    return `Up to ${toDate}`;
  } else {
    return `As of ${currentDate}`;
  }
}

// Prepare table data from items
function prepareTableData(items) {
  const headers = [
    'Item Name',
    'Variant Name',
    'SKU',
    'Quantity',
    'Cost Price',
    'Selling Price',
    'Low Stock Threshold',
    'Date',
  ];

  const data = items.flatMap((item) =>
    item.variants.map((variant) => [
      item.itemName || 'N/A',
      variant.variantName || 'N/A',
      variant.sku || 'N/A',
      variant.quantity || 0,
      formatCurrency(variant.costPrice),
      formatCurrency(variant.price),
      variant.lowStockThreshold || 10,
      formatDate(variant.updatedAt),
    ])
  );

  return { headers: [headers], body: data };
}

// Format date consistently
function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format currency values
function formatCurrency(value) {
  return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
}

// Render the main data table
function renderDataTable(doc, config, tableData) {
  const { colors, spacing } = config;

  autoTable(doc, {
    head: tableData.headers,
    body: tableData.body,
    startY: 35,
    theme: 'grid',
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.white,
    },
    bodyStyles: {
      textColor: colors.text,
    },
    alternateRowStyles: {
      fillColor: colors.alternateRow,
    },
  });
}

// Calculate and render summary section
function renderSummarySection(doc, config, items) {
  const { margins, fonts, spacing } = config;
  const summary = calculateSummary(items);

  // Fallback if no table is rendered before
  const finalY = (doc.lastAutoTable?.finalY || margins.y) + spacing.section;

  // Title
  doc.setFontSize(fonts.header || 14);
  // doc.setFont("helvetica", "bold");
  doc.text('Summary', margins.x, finalY);

  // Prepare summary lines
  const summaryLines = [
    { label: 'Total Quantity', value: summary.totalQuantity },
    {
      label: 'Total Value (at Selling Price)',
      value: formatCurrency(summary.totalValue),
    },
    {
      label: 'Total Cost Value',
      value: formatCurrency(summary.totalCostValue),
    },
    { label: 'Total Profit', value: formatCurrency(summary.totalProfit) },
  ];

  // Styling for values
  doc.setFontSize(fonts.body || 11);
  doc.setFont('helvetica', 'normal');

  // Column positioning (labels left, values right)
  const labelX = margins.x;
  const valueX = doc.internal.pageSize.getWidth() - margins.x;

  summaryLines.forEach((line, index) => {
    const yPos = finalY + spacing.line * (index + 1);
    doc.text(line.label + ':', labelX, yPos);
    doc.text(String(line.value), valueX, yPos, { align: 'right' });
  });
}

// Calculate summary statistics
function calculateSummary(items) {
  let totalQuantity = 0;
  let totalValue = 0;
  let totalCostValue = 0;

  items.forEach((item) => {
    item.variants.forEach((variant) => {
      const quantity = variant.quantity || 0;
      const sellingPrice = variant.price || 0;
      const costPrice = variant.costPrice || 0;

      totalQuantity += quantity;
      totalValue += quantity * sellingPrice;
      totalCostValue += quantity * costPrice;
    });
  });

  return {
    totalQuantity,
    totalValue,
    totalCostValue,
    totalProfit: totalValue - totalCostValue,
  };
}

// Generate appropriate filename
function generateFileName(fromDate) {
  const currentDate = new Date().toISOString().slice(0, 10);
  return `inventory_variants_summary_${fromDate || currentDate}.pdf`;
}
export default function InventoryPage() {
  const [view, setView] = useState('list');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [openCreate, setOpenCreate] = useState(false);
  const [openStockPicker, setOpenStockPicker] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDatePickerDialog, setOpenDatePickerDialog] = useState(false);
  const [pickedItem, setPickedItem] = useState(null);
  const [pickedVariant, setPickedVariant] = useState(null);
  const [activeEditItem, setActiveEditItem] = useState(null);
  const [openHistory, setOpenHistory] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);

  const { data, isLoading, refetch } = useGetInventoryQuery();
  const { data: vendors = [] } = useGetAllVendorsQuery();
  const [updateInfo] = useUpdateInventoryInfoMutation();
  const [deleteItem] = useDeleteInventoryItemMutation();

  const { data: company } = useGetCompanySettingsQuery();
  //-------------------------------
  const settingsRaw = company?.invoiceSettings ?? {};

  // safe defaults so children never crash
  const safeSettings = {
    currency: {
      code: settingsRaw?.currency?.code ?? 'PKR',
      symbol: settingsRaw?.currency?.symbol ?? '₨',
    },
  };
  const currencySymbol = safeSettings.currency.symbol;

  //------------------------------
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
    () => filterItems(data, query, status, fromDate, toDate),
    [data, query, status, fromDate, toDate]
  );
  const total = filtered.length;
  
  const totalPages = Math.ceil((filtered?.length || 0) / pageSize);


  const current = useMemo(
    () =>
      filtered.slice((page - 1) * pageSize, page * pageSize).map((it) => ({
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
    [filtered, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [query, status, fromDate, toDate, pageSize, data]);

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

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handleDatePickerSubmit = (selectedFromDate, selectedToDate) => {
    setOpenDatePickerDialog(false);
    // Filter items specifically for the PDF using the selected dates
    const pdfItems = filterItems(
      data,
      query,
      status,
      selectedFromDate,
      selectedToDate
    );
    generatePDF(pdfItems, selectedFromDate, selectedToDate);
  };

  return (
    <main className="p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mt-4 font-medium">Inventory Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage parts, suppliers, and stock levels for your automotive
            inventory with ease.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setOpenDatePickerDialog(true)}
            disabled={isLoading || filtered.length === 0}
          >
            Download PDF Summary
          </Button>
          <Button
            variant="secondary"
            onClick={() => setOpenStockPicker(true)}
            disabled={isLoading}
          >
            Add Stock
          </Button>
          <Button
            variant="header"
            onClick={() => setOpenCreate(true)}
            disabled={isLoading}
          >
            Create Item
          </Button>
        </div>
      </header>

      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md bg-card rounded-md">
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
          <div className="flex items-center gap-2">
            <label className="text-sm">From:</label>
            <input
              type="date"
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <label className="text-sm">To:</label>
            <input
              type="date"
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

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
              currencySymbol={currencySymbol}
            />
          ) : (
            <InventoryList
              items={current}
              onStockAdded={handleCreated}
              onEditInfo={onEditInfo}
              onEditHistory={onEditViaHistory}
              onDeleteItem={onDeleteItem}
              currencySymbol={currencySymbol}
            />
          )
        ) : (
          <div className="p-4 text-sm text-amber-700">
            Component failed to load. Check exports/paths.
          </div>
        )}
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}
            {'–'}
            {Math.min(page * pageSize, total)} of {total} items
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => {
              const max = Math.max(1, Math.ceil(total / pageSize));
              setPage(Math.min(Math.max(1, p), max));
            }}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            pageSizeOptions={[5, 10, 25, 50, 100]}
          />
        </div>
      </div>

      {CreateInventoryModal && (
        <CreateInventoryModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={handleCreated}
          vendors={vendors}
          currencySymbol={currencySymbol}
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
          currencySymbol={currencySymbol}
        />
      )}

      {DatePickerDialog && (
        <DatePickerDialog
          open={openDatePickerDialog}
          onClose={() => setOpenDatePickerDialog(false)}
          onSubmit={handleDatePickerSubmit}
          initialFromDate={fromDate}
          initialToDate={toDate}
        />
      )}
    </main>
  );
}
