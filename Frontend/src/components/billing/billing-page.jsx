'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Printer,
  ChevronDown,
  ChevronUp,
  Loader,
} from 'lucide-react';
import ThermalPrintSlip from '@/components/billing/ThermalPrintSlip';
/** ====== RTK Query hooks ====== */
import { useGetInventoryQuery } from '@/features/inventoryApi';
import {
  useGetBillsQuery,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useSoftDeleteBillMutation,
} from '@/features/billingApi';

import { Header, StatsCards, FilterBar } from './billingHeader';
import { CreateBillDialog } from './CreateBillDialog';
import { BillRow } from './billing-table-dialog';

export default function BillingPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: bills = [], isLoading: billsLoading } = useGetBillsQuery();

  const [createBill, { isLoading: creating }] = useCreateBillMutation();
  const [updateBillStatus] = useUpdateBillStatusMutation();
  const [softDeleteBill] = useSoftDeleteBillMutation();

  /* ---------- Inventory search state (used in create dialog) ---------- */
  const [searchInventory, setSearchInventory] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [taxPercent, setTaxPercent] = useState(0);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const searchRef = useRef(null);

  /* ---------- Partial Refund Modal ---------- */
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBill, setRefundBill] = useState(null);
  const [refundLines, setRefundLines] = useState([]); // [{ sku, itemName, variantName, maxQty, quantity, reason }]
  const [refundNotes, setRefundNotes] = useState('');

  /* ---------- Delete Bill Modal ---------- */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBillState, setDeleteBillState] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------- Inventory data ---------- */
  const { data: inventoryData, isLoading: inventoryLoading } =
    useGetInventoryQuery();

  //print
  const thermalRef = useRef(null);

  const handlePreviewThermal = (bill) => thermalRef.current?.preview(bill);
  const handlePrintThermal = (bill) => thermalRef.current?.print(bill);
  /* ---------- Flatten inventory for search ---------- */
  const searchableInventory = useMemo(() => {
    const inventoryList =
      (inventoryData && inventoryData.data) || inventoryData || [];
    const flattened = [];

    (inventoryList || []).forEach((product) => {
      flattened.push({
        type: 'product',
        productId: product._id || product.id,
        productName: product.itemName,
        productType: product.itemType,
        description: product.description,
        variants: product.variants || [],
      });

      (product.variants || []).forEach((variant) => {
        flattened.push({
          type: 'variant',
          productId: product._id || product.id,
          productName: product.itemName,
          productType: product.itemType,
          variantId: variant._id || variant.id,
          variantName: variant.variantName,
          sku: variant.sku,
          price: variant.price,
          quantity: variant.quantity,
          description: variant.description,
          costPrice: variant.costPrice ?? 0,
          returnUnder: variant.returnUnder ?? 0,
        });
      });
    });

    return flattened;
  }, [inventoryData]);

  /* ---------- Search results ---------- */
  const searchResults = useMemo(() => {
    if (!searchInventory.trim()) return [];
    const q = searchInventory.toLowerCase().trim();
    return searchableInventory.filter((item) => {
      const searchString = [
        item.productName,
        item.variantName,
        item.sku,
        item.productType,
        item.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchString.includes(q);
    });
  }, [searchInventory, searchableInventory]);

  /* ---------- click-outside to close search results ---------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ---------- Add to "cart" for create bill ---------- */
  const addItemToBill = (item) => {
    if (item.type === 'variant') {
      if (item.quantity <= 0) {
        toast.success('This variant is out of stock.');
        return;
      }
      const existing = items.find((x) => x.variantId === item.variantId);
      if (existing) {
        updateQty(item.variantId, existing.qty + 1);
      } else {
        setItems((prev) => [
          ...prev,
          {
            inventoryItem: item.productId,
            variantId: item.variantId,
            itemName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            price: Number(item.price || 0),
            qty: 1,
            lineTotal: Number(item.price || 0),
            availableQty: Number(item.quantity || 0),
            costPrice: Number(item.costPrice || 0),
            returnUnder: Number(item.returnUnder || 0),
          },
        ]);
      }
    } else if (item.type === 'product') {
      const firstVariant = item.variants?.[0];
      if (!firstVariant) return;
      if (firstVariant.quantity <= 0) {
        toast.error('This variant is out of stock.');
        return;
      }
      const existing = items.find((x) => x.variantId === firstVariant._id);
      if (existing) {
        updateQty(firstVariant._id, existing.qty + 1);
      } else {
        setItems((prev) => [
          ...prev,
          {
            inventoryItem: item.productId,
            variantId: firstVariant._id,
            itemName: item.productName,
            variantName: firstVariant.variantName,
            sku: firstVariant.sku,
            price: Number(firstVariant.price || 0),
            qty: 1,
            lineTotal: Number(firstVariant.price || 0),
            availableQty: Number(firstVariant.quantity || 0),
            costPrice: Number(firstVariant.costPrice || 0),
            returnUnder: Number(firstVariant.returnUnder || 0),
          },
        ]);
      }
    }
    setSearchInventory('');
    setShowSearchResults(false);
  };

  const updateQty = (variantId, qty) => {
    let q = parseInt(String(qty), 10);
    if (Number.isNaN(q) || q < 1) q = 1;
    setItems((prev) =>
      prev.map((it) => {
        if (it.variantId !== variantId) return it;
        const limited = Math.min(q, it.availableQty ?? q);
        return {
          ...it,
          qty: limited,
          lineTotal: Number((limited * it.price).toFixed(2)),
        };
      })
    );
  };

  const removeItem = (variantId) => {
    setItems((prev) => prev.filter((it) => it.variantId !== variantId));
  };

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.lineTotal || 0), 0),
    [items]
  );
  const taxAmount = useMemo(
    () => Number(((subtotal * Number(taxPercent || 0)) / 100).toFixed(2)),
    [subtotal, taxPercent]
  );
  const grandTotal = useMemo(
    () => Number((subtotal + taxAmount).toFixed(2)),
    [subtotal, taxAmount]
  );

  const resetCreateForm = () => {
    setItems([]);
    setBuyer({ name: '', email: '', phone: '' });
    setTaxPercent(0);
    setNotes('');
    setSearchInventory('');
    setShowSearchResults(false);
  };

  const handleSaveBill = async () => {
    if (!items.length) return toast.error('Please add at least one product.');

    // Build request payload
    const payload = {
      buyer,
      items: items.map((it) => ({
        inventoryItem: it.inventoryItem,
        variantId: it.variantId,
        variantName: it.variantName,
        itemName: it.itemName,
        sku: it.sku,
        price: it.price,
        quantity: it.qty,
        lineTotal: it.lineTotal,
        costPrice: it.costPrice ?? 0,
        returnUnder: it.returnUnder ?? 0,
        refundAmount: 0,
        status: 'pending',
        total: it.lineTotal,
      })),
      subtotal,
      taxPercent: Number(taxPercent || 0),
      taxAmount,
      total: grandTotal,
      notes,
      paymentMethod, // ✅ keep only this (no duplicate key)
      status: 'pending',
    };

    try {
      // create bill on server
      const res = await createBill(payload).unwrap();

      // Normalize the created bill (API may return `data` or the object itself)
      const createdBill = res?.data ||
        res || {
          ...payload,
          _id: 'LOCAL',
          billNumber: '(Draft)',
          createdAt: new Date().toISOString(),
        };

      // OPTIONAL: auto-print after successful creation
      // thermalRef?.current?.print(createdBill);

      // Cleanup UI
      resetCreateForm();
      setIsCreateModalOpen(false);
      toast.success('Bill created successfully.');
    } catch (e) {
      console.error('Create bill failed:', e);
      toast.error(e?.data?.error || 'Failed to create bill.');
    }
  };

  /* ---------- filter + search over fetched bills ---------- */
  const filteredBills = useMemo(() => {
    const list = Array.isArray(bills) ? bills : [];
    return list.filter((b) => {
      const statusOk =
        filterStatus === 'all' ? true : b.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const inText =
        (b.billNumber || '').toLowerCase().includes(q) ||
        ((b.buyer && b.buyer.name) || '').toLowerCase().includes(q) ||
        ((b.buyer && b.buyer.email) || '').toLowerCase().includes(q) ||
        ((b.buyer && b.buyer.phone) || '').toLowerCase().includes(q);
      return statusOk && inText;
    });
  }, [bills, filterStatus, searchQuery]);

  /* ---------- pagination over filteredBills ---------- */
  const totalRecords = filteredBills.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // reset page if filters change and current page out of range
  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery, pageSize]);

  const paginatedBills = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredBills.slice(start, end);
  }, [filteredBills, page, pageSize]);

  /* ---------- summary from filteredBills ---------- */
  const summaryStats = useMemo(() => {
    const completed = filteredBills.filter((x) => x.status === 'completed');
    const pending = filteredBills.filter((x) => x.status === 'pending');

    // Paid bills
    const paid = filteredBills.filter((x) => x.status === 'paid');

    // Refund-related
    const refunded = filteredBills.filter(
      (x) => x.status === 'refunded' || x.status === 'partially_refunded'
    );
    const totalRefunded = refunded.reduce(
      (sum, x) => sum + (Number(x.refundDetails?.totalRefundAmount) || 0),
      0
    );

    // Revenue-related
    const totalRevenue = paid.reduce(
      (sum, x) => sum + (Number(x.total) || 0),
      0
    );
    const todayStr = new Date().toDateString();
    const todayRevenue = paid
      .filter((x) => new Date(x.createdAt).toDateString() === todayStr)
      .reduce((sum, x) => sum + (Number(x.total) || 0), 0);

    return {
      total: filteredBills.length,
      completed: completed.length,
      pending: pending.length,
      paid: paid.length, // ✅ total paid bills
      refunded: refunded.length, // ✅ total refunded bills
      totalRefunded, // ✅ sum refunded
      todayRevenue,
      totalRevenue,
    };
  }, [filteredBills]);

  const onPrintBill = (bill) => {
    thermalRef.current?.print(bill);
  };

  /* ---------- Delete handlers (NO BODY) ---------- */
  const openDeleteDialog = (bill) => {
    setDeleteBillState(bill);
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!deleteBillState?._id) return;
    try {
      setDeleting(true);
      // NO BODY — backend doesn’t need it now
      await softDeleteBill(deleteBillState._id).unwrap();
      setDeleteOpen(false);
      setDeleteBillState(null);
      toast.success('Bill deleted and items returned to inventory.');
    } catch (e) {
      console.error(e);
      toast.error(e?.data?.error || 'Failed to delete bill.');
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Refund Handlers ---------- */
  const openPartialRefundModal = (bill) => {
    const lines = (bill.items || []).map((it) => ({
      sku: it.sku,
      itemName: it.itemName,
      variantName: it.variantName,
      maxQty: Number(it.quantity || 0),
      quantity: 0,
      reason: '',
    }));
    setRefundBill(bill);
    setRefundLines(lines);
    setRefundNotes('');
    setRefundOpen(true);
  };

  const handleRefundFull = async (bill) => {
    if (!bill?._id) return;
    if (!confirm('Are u sure you want to refund this bill?')) return;

    try {
      // empty body -> backend interprets FULL refund (based on your update status logic)
      await updateBillStatus({ id: bill._id, body: {} }).unwrap();
      toast.success('Bill fully refunded.');
    } catch (e) {
      console.error(e);
      toast.error(e?.data?.error || 'Failed to process full refund.');
    }
  };

  const handleRefundAction = (bill, type) => {
    if (type === 'partial') {
      openPartialRefundModal(bill);
    } else {
      handleRefundFull(bill);
    }
  };

  const submitPartialRefund = async () => {
    if (!refundBill?._id) return;

    const refundItems = refundLines
      .filter((l) => Number(l.quantity) > 0)
      .map((l) => ({
        sku: l.sku,
        quantity: Number(l.quantity),
        reason: l.reason?.trim() || 'Partial refund',
      }));

    if (refundItems.length === 0) {
      if (!confirm('No quantities selected. Process FULL refund instead?'))
        return;
      try {
        await updateBillStatus({
          id: refundBill._id,
          body: { notes: refundNotes?.trim() || '' },
        }).unwrap();
        toast.success('Bill fully refunded.');
        setRefundOpen(false);
        setRefundBill(null);
        setRefundLines([]);
        setRefundNotes('');
        return;
      } catch (e) {
        console.error(e);
        toast.error(e?.data?.error || 'Failed to process refund.');
        return;
      }
    }

    try {
      await updateBillStatus({
        id: refundBill._id,
        body: {
          refundItems,
          notes: refundNotes?.trim() || 'Partial refund from UI',
        },
      }).unwrap();

      setRefundOpen(false);
      setRefundBill(null);
      setRefundLines([]);
      setRefundNotes('');
      toast.success('Partial refund processed.');
    } catch (e) {
      console.error(e);
      toast.error(e?.data?.error || 'Failed to process partial refund.');
    }
  };

  return (
    <div className="bg-background">
      <Header onCreate={() => setIsCreateModalOpen(true)} />

      <main className="mx-auto px-6 py-8">
        <StatsCards summary={summaryStats} />

        <FilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Bills</CardTitle>
            <CardDescription>View and manage all bills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead>Bill #</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billsLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                        Loading bills…
                      </TableCell>
                    </TableRow>
                  ) : paginatedBills.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No bills found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBills.map((bill) => (
                      <BillRow
                        key={bill._id}
                        bill={bill}
                        expanded={expandedBillId === bill._id}
                        onToggleExpand={() =>
                          setExpandedBillId((prev) =>
                            prev === bill._id ? null : bill._id
                          )
                        }
                        onEdit={handleRefundAction} // Refund submenu
                        onPrint={() => handlePrintThermal(bill)} // ✅ print
                        onPreview={() => handlePreviewThermal(bill)} // ✅ preview
                        onDelete={() => openDeleteDialog(bill)} // Delete dialog
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination controls */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium">
                  {Math.min((page - 1) * pageSize + 1, totalRecords)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(page * pageSize, totalRecords)}
                </span>{' '}
                of <span className="font-medium">{totalRecords}</span> results
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm">Rows per page</label>
                <select
                  className="border rounded px-2 py-1 bg-background"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <span className="text-sm">
                  Page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== Partial Refund Dialog ===== */}
        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Partial Refund</DialogTitle>
              <DialogDescription>
                Select items and quantities to refund for bill{' '}
                <span className="font-medium">{refundBill?.billNumber}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border rounded-md divide-y">
                {refundLines.map((line, idx) => (
                  <div
                    key={`${line.sku}-${idx}`}
                    className="p-3 flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {line.itemName}{' '}
                        <span className="text-muted-foreground">
                          · {line.variantName}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {line.sku}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Max refundable: {line.maxQty}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={line.maxQty}
                        value={line.quantity}
                        onChange={(e) => {
                          const v = Math.max(
                            0,
                            Math.min(line.maxQty, Number(e.target.value || 0))
                          );
                          setRefundLines((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, quantity: v } : l
                            )
                          );
                        }}
                        className="w-24"
                        placeholder="Qty"
                      />
                      <Input
                        value={line.reason}
                        onChange={(e) =>
                          setRefundLines((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, reason: e.target.value } : l
                            )
                          )
                        }
                        className="w-56"
                        placeholder="Reason (optional)"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm mb-1">Notes (optional)</label>
                <Input
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Add any notes about this partial refund"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRefundOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitPartialRefund}>
                  Submit Partial Refund
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ===== Delete Bill Dialog (NO BODY) ===== */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Bill</DialogTitle>
              <DialogDescription>
                This will mark the bill as deleted and return all items to
                inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="text-sm">
                Bill:&nbsp;
                <span className="font-medium">
                  {deleteBillState?.billNumber}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitDelete} disabled={deleting}>
                  {deleting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Bill
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Create Bill Dialog */}
      <CreateBillDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        creating={creating}
        searchRef={searchRef}
        searchInventory={searchInventory}
        setSearchInventory={setSearchInventory}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        inventoryLoading={inventoryLoading}
        searchResults={searchResults}
        addItemToBill={addItemToBill}
        items={items}
        updateQty={updateQty}
        removeItem={removeItem}
        buyer={buyer}
        setBuyer={setBuyer}
        taxPercent={taxPercent}
        setTaxPercent={setTaxPercent}
        notes={notes}
        setNotes={setNotes}
        subtotal={subtotal}
        taxAmount={taxAmount}
        grandTotal={grandTotal}
        onSave={handleSaveBill}
        onReset={resetCreateForm}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      
        onPreviewReceipt={(draft) => handlePreviewThermal(draft)}
        onPrintReceipt={(draft) => handlePrintThermal(draft)}
      />
      <ThermalPrintSlip ref={thermalRef} />
      <Toaster richColors position="top-right" />
    </div>
  );
}
