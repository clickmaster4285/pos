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
import ThermalPrintSlip from '@/components/billing/ThermalPrintSlip';
import { useGetInventoryQuery } from '@/features/inventoryApi';
import {
  useGetBillsQuery,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useSoftDeleteBillMutation,
  //  useRefundBillPartialMutation,
} from '@/features/billingApi';
import { useGetCompanyQuery } from '@/features/CompanyApi';
import { Header, StatsCards, FilterBar } from './billingHeader';
import { CreateBillDialog } from './CreateBillDialog';
import { BillRow } from './billTable';
import { useClickOutside } from '@/utils/useClickOutside';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';
import BillingSummaryPDF from './BillingSummaryPDF'; // Import the BillingSummaryPDF component
import BillDetailsSheet from './BillDetailsSheet';

import { useContext } from 'react';
import { AuthContext } from '@/components/auth/SecureAuthProvider';

export default function BillingPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { user } = useContext(AuthContext) || {};
  const addPermission = user?.permissions?.addBilling;
  const updatePermission = user?.permissions?.editBilling;
  const deletePermission = user?.permissions?.deleteBilling;

  const { data: bills = [], isLoading: billsLoading } = useGetBillsQuery();

  // helpers (top-level in the component file)
  const sumRefundQtyForItem = (item = {}) =>
    (item.refundHistory || []).reduce(
      (s, r) => s + (r?.refundQuantity || 0),
      0
    );

  const sumRefundQtyForBill = (bill = {}) =>
    (bill.items || []).reduce((s, it) => s + sumRefundQtyForItem(it), 0);

  // replace your current totalRefundQuantity with this:
  const totalRefundQtyByBill = useMemo(() => {
    const map = {};
    (bills || []).forEach((b) => {
      map[b._id] = sumRefundQtyForBill(b);
    });
    return map;
  }, [bills]);

  const { data: companyData, isLoading: companyLoading } = useGetCompanyQuery();
  const [createBill, { isLoading: creating }] = useCreateBillMutation();
  const [updateBillStatus] = useUpdateBillStatusMutation();
  const [softDeleteBill] = useSoftDeleteBillMutation();
  const { data: inventoryData, isLoading: inventoryLoading } =
    useGetInventoryQuery();

  const [searchInventory, setSearchInventory] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [taxPercent, setTaxPercent] = useState(0);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const searchRef = useRef(null);
  const thermalRef = useRef(null);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBill, setRefundBill] = useState(null);
  const [refundLines, setRefundLines] = useState([]);
  const [refundNotes, setRefundNotes] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBillState, setDeleteBillState] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmRefundOpen, setConfirmRefundOpen] = useState(false);
  const [billToRefund, setBillToRefund] = useState(null);

  //const [refundBillPartial] = useRefundBillPartialMutation();
  // Define totalRecords based on bills data
  const totalRecords = useMemo(() => bills.length, [bills]);

  useClickOutside(searchRef, () => setShowSearchResults(false));

  // Update taxPercent when paymentMethod or taxRates change
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
  }, [paymentMethod]);

  const taxRates = useMemo(
    () => ({
      taxRateCash: companyData?.data?.invoiceSettings?.tax?.taxRateCash || 0,
      taxRateCard: companyData?.data?.invoiceSettings?.tax?.taxRateCard || 0,
    }),
    [companyData]
  );

  const searchableInventory = useMemo(() => {
    const inventoryList =
      (inventoryData && inventoryData.data) || inventoryData || [];
    const flattened = [];

    inventoryList.forEach((product) => {
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
          quantity: variant.quantity || 1,
          description: variant.description,
          costPrice: variant.costPrice ?? 0,
          returnUnder: variant.returnUnder ?? 0,
        });
      });
    });

    return flattened;
  }, [inventoryData]);

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

  const addItemToBill = (item) => {
    if (item.type === 'variant') {
      if (item.quantity <= 0) {
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
            price: Number(item.price || 0),
            qty: 1,
            lineTotal: Number(item.price || 0),
            availableQty: Number(item.quantity || 0),
            costPrice: Number(item.costPrice || 0),
            returnUnder: Number(item.returnUnder || 0),
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
        const available = Number(it.availableQty || 0);
        const limited = Math.min(q, available > 0 ? available : q);
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
        taxPercent: Number(taxPercent),
        taxAmount,
        total: grandTotal,
        paymentMethod,
        paymentNumber,
        notes,
        companyId: companyData?.data?._id || '',
      };
      await createBill(billData).unwrap();
      toast.success('Bill created successfully');
      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      toast.error('Failed to create bill');
      console.error(error);
    }
  };

  const handlePreviewThermal = (draft) => {
    thermalRef.current?.print(draft);
  };

  const handlePrintThermal = (draft) => {
    thermalRef.current?.print(draft);
  };

  // Import the new mutation

  //----------------------------------------------------
  // ✅ Replace your existing submitPartialRefund with this
  const submitPartialRefund = async () => {
    try {
      // must come from the partial flow
      if (!refundBill?._id) {
        toast.error('No bill selected for partial refund');
        return;
      }

      // build payload
      const refundItems = refundLines
        .filter((line) => Number(line.quantity) > 0)
        .map((line) => ({
          sku: line.sku,
          quantity: Number(line.quantity),
          reason: line.reason || '',
        }));

      if (refundItems.length === 0) {
        toast.error('Select at least one item to refund');
        return;
      }

      const payload = {
        id: refundBill._id,
        refundItems,
        notes: refundNotes || '',
      };

      console.log('Submitting partial refund', payload);

      await updateBillStatus(payload).unwrap();

      toast.success('Partial refund processed');
      setRefundOpen(false);
      setRefundLines([]);
      setRefundNotes('');
      // optional cleanup
    } catch (error) {
      console.error('Partial refund failed:', error);
      toast.error(error?.data?.message || 'Failed to process partial refund');
    }
  };

  //----------------------------------
  const submitFullRefund = async () => {
    try {
      console.log('bill refund', billToRefund._id);
      await updateBillStatus({
        id: billToRefund?._id,
        status: 'refunded',
      }).unwrap();
      toast.success('Full refund processed');
      setConfirmRefundOpen(false);
      setBillToRefund(null);
    } catch (error) {
      toast.error('Failed to process full refund');
      console.error(error);
    }
  };

  const submitDelete = async () => {
    try {
      setDeleting(true);
      await softDeleteBill(deleteBillState?._id).unwrap();
      toast.success('Bill deleted successfully');
      setDeleteOpen(false);
      setDeleteBillState(null);
    } catch (error) {
      toast.error('Failed to delete bill');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const resetCreateForm = () => {
    setItems([]);
    setBuyer({ name: '', email: '', phone: '' });
    setTaxPercent(
      paymentMethod === PAYMENT_METHODS.CASH
        ? taxRates.taxRateCash
        : taxRates.taxRateCard || 0
    );
    setNotes('');
    setPaymentMethod(PAYMENT_METHODS.CASH);
    setPaymentNumber('');
  };

  const filteredBills = useMemo(() => {
    let filtered = bills;
    if (searchQuery) {
      filtered = filtered.filter(
        (bill) =>
          bill.billNumber.includes(searchQuery) ||
          bill.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          false ||
          bill.buyer?.email
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          false
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((bill) => bill.status === filterStatus);
    }
    return filtered;
  }, [bills, searchQuery, filterStatus]);
  // for detail side model open
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const openBillDetails = (bill) => {
    setSelectedBill(bill);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <Header
        onCreate={() => setIsCreateModalOpen(true)}
        addPermission={addPermission}
      />
      <div className="mx-auto px-6">
        <StatsCards
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
              .reduce((sum, b) => sum + Number(b.total || 0), 0),
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
                  filteredBills
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((bill) => (
                      <BillRow
                        key={bill._id}
                        bill={bill}
                        onView={() => openBillDetails(bill)}
                        expanded={expandedBillId === bill._id}
                        onToggleExpand={() =>
                          setExpandedBillId(
                            expandedBillId === bill._id ? null : bill._id
                          )
                        }
                        onEdit={(bill, type) => {
                          if (type === 'partial') {
                            setRefundBill(bill);
                            setRefundLines(
                              bill.items.map((item) => ({
                                ...item,
                                maxQty: item.quantity,
                                quantity: 0,
                                reason: '',
                              }))
                            );
                            setRefundOpen(true);
                          } else if (type === 'full') {
                            setBillToRefund(bill);
                            setConfirmRefundOpen(true);
                          }
                        }}
                        onPrint={(bill) => handlePrintThermal(bill)}
                        onDelete={(billId) => {
                          setDeleteBillState(
                            bills.find((b) => b._id === billId)
                          );
                          setDeleteOpen(true);
                        }}
                        deletePermission={deletePermission}
                        updatePermission={updatePermission}
                      />
                    ))
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, totalRecords)} of {totalRecords}{' '}
                bills
              </div>
              <div className="flex items-center gap-2">
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
                  <span className="font-medium">
                    {Math.ceil(totalRecords / pageSize)}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.ceil(totalRecords / pageSize), p + 1)
                    )
                  }
                  disabled={page === Math.ceil(totalRecords / pageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

      <BillDetailsSheet
        open={detailsOpen}
        onOpenChange={(o) => setDetailsOpen(o)}
        bill={selectedBill}
        onPrint={(bill) => handlePrintThermal(bill)}
        totalRefundQty={
          selectedBill ? totalRefundQtyByBill[selectedBill._id] || 0 : 0
        }
      />
    </div>
  );
}
