'use client';

import { useMemo, useState, useEffect, useRef, useContext } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
import { Loader, Printer, Trash2 } from 'lucide-react';
import Pagination from '../ui/Pagination';
import { useGetCompanySettingsQuery } from '@/features/settingsApi';
import { useGetInventoryQuery } from '@/features/inventoryApi';
import {
  useGetBillsQuery,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useSoftDeleteBillMutation,
} from '@/features/billingApi';
import { useGetCompanyQuery } from '@/features/CompanyApi';

import { Header, StatsCards, FilterBar } from './billingHeader';
import { CreateBillDialog } from './CreateBillDialog';
import { BillRow } from './billTable';
import ThermalPrintSlip from '@/components/billing/ThermalPrintSlip';
import BillDetailsSheet from './BillDetailsSheet';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';
import { useClickOutside } from '@/utils/useClickOutside';
import RefundDialog from '@/components/billing/RefundDialog';

import { AuthContext } from '@/components/auth/SecureAuthProvider';

// ---------- helpers ----------
const n = (v) => Number(v || 0);

// Sum refunded qty for a single item (based on refundHistory)
const sumRefundQtyForItem = (item = {}) =>
  (item.refundHistory || []).reduce((s, r) => s + n(r?.refundQuantity), 0);

// -----------------------------
export default function BillingPage() {
  // permissions
  const { user } = useContext(AuthContext) || {};
  const addPermission = user?.permissions?.addBilling;
  const updatePermission = user?.permissions?.editBilling;
  const deletePermission = user?.permissions?.deleteBilling;

  // queries/mutations
  const { data: bills = [], isLoading: billsLoading } = useGetBillsQuery();
  const { data: company, isLoading: settingsLoading } =
    useGetCompanySettingsQuery();
  const { data: companyData, isLoading: companyLoading } = useGetCompanyQuery();
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    refetch,
  } = useGetInventoryQuery();

  const [createBill, { isLoading: creating }] = useCreateBillMutation();
  const [updateBillStatus] = useUpdateBillStatusMutation();
  const [softDeleteBill] = useSoftDeleteBillMutation();

  // currency
  const settingsRaw = company?.invoiceSettings ?? {};
  const currencySymbol =
    settingsRaw?.currency?.symbol ?? company?.currency?.symbol ?? '₨';

  // UI state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBillId, setExpandedBillId] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // reset to first page when filters/search/pageSize change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus, pageSize]);

  // inventory search
  const [searchInventory, setSearchInventory] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  useClickOutside(searchRef, () => setShowSearchResults(false));

  const thermalRef = useRef(null);

  // create bill form
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [taxPercent, setTaxPercent] = useState(0);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');

  // tax rates
  const taxRates = useMemo(
    () => ({
      taxRateCash: companyData?.data?.invoiceSettings?.tax?.taxRateCash || 0,
      taxRateCard: companyData?.data?.invoiceSettings?.tax?.taxRateCard || 0,
    }),
    [companyData]
  );

  useEffect(() => {
    if (paymentMethod === PAYMENT_METHODS.CASH) {
      setTaxPercent(taxRates.taxRateCash || 0);
    } else if (
      paymentMethod === PAYMENT_METHODS.CREDIT_CARD ||
      paymentMethod === PAYMENT_METHODS.BANK_TRANSFER
    ) {
      setTaxPercent(taxRates.taxRateCard || 0);
    } else {
      setTaxPercent(0);
    }
  }, [paymentMethod, taxRates]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + n(it.lineTotal), 0),
    [items]
  );
  const taxAmount = useMemo(
    () => n(((subtotal * n(taxPercent)) / 100).toFixed(2)),
    [subtotal, taxPercent]
  );
  const grandTotal = useMemo(
    () => n((subtotal + taxAmount).toFixed(2)),
    [subtotal, taxAmount]
  );

  const inventoryList =
    (inventoryData && inventoryData.data) || inventoryData || [];
  const searchableInventory = useMemo(() => {
    const out = [];
    inventoryList.forEach((product) => {
      (product.variants || []).forEach((variant) => {
        out.push({
          type: 'variant',
          productId: product._id || product.id,
          productName: product.itemName,
          productType: product.itemType,
          variantId: variant._id || variant.id,
          variantName: variant.variantName,
          sku: variant.sku,
          price: variant.price,
          quantity: variant.quantity || 1,
          description: variant.description,
          costPrice: variant.costPrice ?? 0,
          returnUnder: variant.returnUnder ?? 0,
        });
      });
    });
    return out;
  }, [inventoryList]);

  const searchResults = useMemo(() => {
    if (!searchInventory.trim()) return [];
    const q = searchInventory.toLowerCase().trim();
    return searchableInventory.filter((item) => {
      const s = [
        item.productName,
        item.variantName,
        item.sku,
        item.productType,
        item.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return s.includes(q);
    });
  }, [searchInventory, searchableInventory]);

  const addItemToBill = (item) => {
    if (item.type !== 'variant') return;
    if (n(item.quantity) <= 0) {
      toast.error('This variant is out of stock.');
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
          price: n(item.price),
          qty: 1,
          lineTotal: n(item.price),
          availableQty: n(item.quantity),
          costPrice: n(item.costPrice),
          returnUnder: n(item.returnUnder),
        },
      ]);
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
        const available = n(it.availableQty);
        const limited = Math.min(q, available > 0 ? available : q);
        return {
          ...it,
          qty: limited,
          lineTotal: n((limited * it.price).toFixed(2)),
        };
      })
    );
  };

  const removeItem = (variantId) =>
    setItems((prev) => prev.filter((it) => it.variantId !== variantId));

  const handleSaveBill = async () => {
    try {
      const billData = {
        buyer,
        items: items.map((it) => ({
          inventoryItem: it.inventoryItem,
          variantId: it.variantId,
          itemName: it.itemName,
          variantName: it.variantName,
          sku: it.sku,
          price: it.price,
          quantity: it.qty,
          total: it.lineTotal,
          costPrice: it.costPrice,
          returnUnder: it.returnUnder,
        })),
        subtotal,
        taxPercent: n(taxPercent),
        taxAmount,
        total: grandTotal,
        paymentMethod,
        paymentNumber,
        notes,
        companyId: companyData?.data?._id || '',
      };
      await createBill(billData).unwrap();
      await refetch?.();
      toast.success('Bill created successfully');

      setIsCreateModalOpen(false);

      resetCreateForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create bill');
    }
  };

  const resetCreateForm = () => {
    setItems([]);
    setBuyer({ name: '', email: '', phone: '' });
    setNotes('');
    setPaymentMethod(PAYMENT_METHODS.CASH);
    setPaymentNumber('');
    setTaxPercent(
      PAYMENT_METHODS.CASH ? taxRates.taxRateCash : taxRates.taxRateCard || 0
    );
  };

  const handlePreviewThermal = (draft) => thermalRef.current?.print(draft);
  const handlePrintThermal = (draft) => thermalRef.current?.print(draft);

  // ---------------- Partial Refund (modal state) ----------------
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBill, setRefundBill] = useState(null);
  const [refundLines, setRefundLines] = useState([]);
  const [refundNotes, setRefundNotes] = useState('');

  // Build lines w/ remaining refundable qty when opening partial refund
  const openPartialRefund = (bill) => {
    setRefundBill(bill);
    const lines = (bill.items || []).map((item) => {
      const purchasedQty = n(item.quantity);
      const refundedQty = sumRefundQtyForItem(item);
      const remainingQty = Math.max(0, purchasedQty - refundedQty);
      return {
        sku: item.sku,
        itemName: item.itemName,
        variantName: item.variantName,
        purchasedQty,
        alreadyRefunded: refundedQty,
        maxQty: remainingQty,
        quantity: 0,
        reason: '',
      };
    });
    setRefundLines(lines);
    setRefundNotes('');
    setRefundOpen(true);
  };

  const submitPartialRefund = async () => {
    try {
      if (!refundBill?._id) {
        toast.error('No bill selected for partial refund');
        return;
      }
      const refundItems = refundLines
        .filter((l) => n(l.quantity) > 0 && n(l.quantity) <= n(l.maxQty))
        .map((l) => ({
          sku: l.sku,
          quantity: n(l.quantity),
          reason: l.reason || '',
        }));
      if (refundItems.length === 0) {
        toast.error('Select at least one valid quantity');
        return;
      }
      await updateBillStatus({
        id: refundBill._id,
        refundItems,
        notes: refundNotes || '',
      }).unwrap();

      toast.success('Partial refund processed');
      setRefundOpen(false);
      setRefundLines([]);
      setRefundNotes('');
      setRefundBill(null);
    } catch (error) {
      console.error('Partial refund failed:', error);
      toast.error(error?.data?.message || 'Failed to process partial refund');
    }
  };

  // ---------------- Full Refund Confirm ----------------
  const [confirmRefundOpen, setConfirmRefundOpen] = useState(false);
  const [billToRefund, setBillToRefund] = useState(null);

  const submitFullRefund = async () => {
    try {
      await updateBillStatus({
        id: billToRefund?._id,
        status: 'refunded',
      }).unwrap();
      toast.success('Full refund processed');
      setConfirmRefundOpen(false);
      setBillToRefund(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process full refund');
    }
  };

  // ---------------- Delete Confirm ----------------
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBillState, setDeleteBillState] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const submitDelete = async () => {
    try {
      setDeleting(true);
      await softDeleteBill(deleteBillState?._id).unwrap();
      toast.success('Bill deleted successfully');
      setDeleteOpen(false);
      setDeleteBillState(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  };

  // details sheet
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const openBillDetails = (bill) => {
    setSelectedBill(bill);
    setDetailsOpen(true);
  };

  // computed
  const totalRecords = useMemo(() => bills.length, [bills]);

  const filteredBills = useMemo(() => {
    let filtered = bills;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bill) =>
          bill.billNumber.toLowerCase().includes(q) ||
          (bill.buyer?.name || '').toLowerCase().includes(q) ||
          (bill.buyer?.email || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((bill) => bill.status === filterStatus);
    }
    return filtered;
  }, [bills, searchQuery, filterStatus]);

  // pagination derivations (after filters)
  const total = filteredBills.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pagedBills = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, page, pageSize]);

  // For details sheet: total refunded qty across items
  const totalRefundQtyByBill = useMemo(() => {
    const map = {};
    (bills || []).forEach((b) => {
      map[b._id] = (b.items || []).reduce(
        (s, it) => s + sumRefundQtyForItem(it),
        0
      );
    });
    return map;
  }, [bills]);

  return (
    <div className="space-y-6">
      <Header
        onCreate={() => setIsCreateModalOpen(true)}
        addPermission={addPermission}
      />

      <div className="mx-auto px-6">
        <StatsCards
          currencySymbol={currencySymbol}
          summary={{
            total: totalRecords,
            paid: bills.filter((b) => b.status === 'paid').length,
            refunded: bills.filter(
              (b) =>
                b.status === 'refunded' || b.status === 'partially_refunded'
            ).length,
            todayRevenue: bills
              .filter(
                (b) =>
                  b.status === 'paid' &&
                  new Date(b.createdAt).toDateString() ===
                    new Date().toDateString()
              )
              .reduce((sum, b) => sum + n(b.total), 0),
          }}
        />

        <FilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <Card>
          <CardHeader>
            <CardTitle>Bills</CardTitle>
            <CardDescription>View and manage all bills</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Number</TableHead>
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
                    <TableCell colSpan={7} className="text-center">
                      <Loader className="w-4 h-4 animate-spin inline mr-2" />
                      Loading bills...
                    </TableCell>
                  </TableRow>
                ) : filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedBills.map((bill) => (
                    <BillRow
                      key={bill._id}
                      bill={bill}
                      currencySymbol={currencySymbol}
                      onView={() => openBillDetails(bill)}
                      expanded={expandedBillId === bill._id}
                      onToggleExpand={() =>
                        setExpandedBillId(
                          expandedBillId === bill._id ? null : bill._id
                        )
                      }
                      onEdit={(b, type) => {
                        if (type === 'partial') {
                          openPartialRefund(b);
                        } else if (type === 'full') {
                          setBillToRefund(b);
                          setConfirmRefundOpen(true);
                        }
                      }}
                      onPrint={(b) => handlePrintThermal(b)}
                      onDelete={(billId) => {
                        const toDel = bills.find((x) => x._id === billId);
                        setDeleteBillState(toDel || null);
                        setDeleteOpen(true);
                      }}
                      deletePermission={deletePermission}
                      updatePermission={updatePermission}
                    />
                  ))
                )}
              </TableBody>
            </Table>

            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, total)} of {total} bills
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) =>
                  setPage(Math.min(Math.max(1, p), totalPages))
                }
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Partial Refund (child) */}
        <RefundDialog
          open={refundOpen}
          onOpenChange={setRefundOpen}
          bill={refundBill}
          lines={refundLines}
          setLines={setRefundLines}
          notes={refundNotes}
          setNotes={setRefundNotes}
          onSubmit={submitPartialRefund}
        />

        {/* Delete Confirm */}
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

        {/* Full Refund Confirm */}
        <Dialog open={confirmRefundOpen} onOpenChange={setConfirmRefundOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Full Refund</DialogTitle>
              <DialogDescription>
                Are you sure you want to fully refund bill{' '}
                <span className="font-medium">{billToRefund?.billNumber}</span>?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmRefundOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitFullRefund}>Confirm Refund</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Bill */}
        <CreateBillDialog
          currencySymbol={currencySymbol}
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
          paymentNumber={paymentNumber}
          setPaymentNumber={setPaymentNumber}
          onPreviewReceipt={(draft) => handlePreviewThermal(draft)}
          onPrintReceipt={(draft) => handlePrintThermal(draft)}
          companyId={companyData?.data?._id || ''}
          taxRates={taxRates}
          companyLoading={companyLoading}
        />

        <ThermalPrintSlip ref={thermalRef} />
      </div>

      {/* Details sheet */}
      <BillDetailsSheet
        currencySymbol={currencySymbol}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        bill={selectedBill}
        onPrint={(b) => handlePrintThermal(b)}
        totalRefundQty={
          selectedBill
            ? (selectedBill.items || []).reduce(
                (s, it) => s + sumRefundQtyForItem(it),
                0
              )
            : 0
        }
      />
    </div>
  );
}
