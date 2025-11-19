// Modified: billing-page.jsx (added discount reset in onReset, minor fixes)
// No major changes, just ensuring discount is reset
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Header, StatsCards, FilterBar } from './billingHeader';
import { BillRow } from './billTable';
import BillDetailsSheet from './BillDetailsSheet';
import { CreateBillDialog } from './CreateBillDialog';
import { RefundDialog } from './RefundDialog';
import { ThermalPrintSlip } from './ThermalPrintSlip';
import {
  useGetBillsQuery,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useSoftDeleteBillMutation,
} from '@/features/billingApi';
import { useGetAllProductsQuery } from '@/features/productApi';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';
import { useGetCompanySettingsQuery } from '@/features/settingsApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Map UI enum -> backend strings your controller expects
const toBackendPaymentMethod = (pm) => {
  if (pm === PAYMENT_METHODS.CASH) return 'cash';
  if (pm === PAYMENT_METHODS.CREDIT_CARD) return 'credit_card';
  if (pm === PAYMENT_METHODS.BANK_TRANSFER) return 'bank_transfer';
  return 'cash';
};

// Extract unique orderIds from billData or from preview items (if they embed orderId)
const extractOrderIds = (billData, items) => {
  // Preferred: explicit orderIds from dialog
  if (Array.isArray(billData?.orderIds) && billData.orderIds.length > 0) {
    return [...new Set(billData.orderIds.map(String))];
  }
  // Fallback: scan preview items for item.orderId
  const ids = (items || [])
    .map((it) => it?.orderId)
    .filter(Boolean)
    .map(String);
  return [...new Set(ids)];
};

const getSingleOrderId = (billData, items) =>
  billData?.orderId ||
  (items.find((it) => it.orderId)?.orderId
    ? String(items.find((it) => it.orderId).orderId)
    : '');

export default function BillingPage() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [detailsBill, setDetailsBill] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundType, setRefundType] = useState('partial');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [searchProduct, setSearchProduct] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [items, setItems] = useState([]);
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [companyId, setCompanyId] = useState(''); // TODO: Set from auth context
  const [taxRates, setTaxRates] = useState({
    taxRateCash: 18,
    taxRateCard: 10,
  });
  const [companyLoading, setCompanyLoading] = useState(false);
  const searchRef = useRef(null);

  const {
    data: products = { data: [], pagination: {} },
    isLoading: productsLoading,
  } = useGetAllProductsQuery({ page: 1, limit: 100 });

  const { data: billsData, refetch: refetchBills } = useGetBillsQuery({
    page: 1,
    limit: 100,
  });
  const [createBill] = useCreateBillMutation();
  const { data: company, isLoading: settingsLoading } =
    useGetCompanySettingsQuery();
  const [updateBillStatus] = useUpdateBillStatusMutation();
  const [softDeleteBill] = useSoftDeleteBillMutation();

  const settingsRaw = company?.invoiceSettings ?? {};
  const currencySymbol =
    settingsRaw?.currency?.symbol ?? company?.currency?.symbol ?? '€';
  

  useEffect(() => {
    if (company) {
      setTaxRates({
        taxRateCash: settingsRaw?.tax?.taxRateCash ?? 18,
        taxRateCard: settingsRaw?.tax?.taxRateCard ?? 10,
      });
      setCompanyLoading(settingsLoading);
    }
  }, [company, settingsRaw, settingsLoading]);

  useEffect(() => {
    if (billsData) {
      setBills(billsData.data || []);
    }
  }, [billsData]);

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: bills.length,
      paid: bills.filter((b) => b.status === 'paid').length,
      refunded: bills.filter((b) => b.status === 'refunded').length,
      todayRevenue: bills
        .filter(
          (b) =>
            b.status === 'paid' &&
            new Date(b.createdAt).toDateString() === today.toDateString()
        )
        .reduce((sum, b) => sum + (b.total || 0), 0),
    };
  }, [bills]);

  const filteredBills = useMemo(() => {
    let result = bills;
    if (filterStatus !== 'all') {
      result = result.filter((b) => b.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.billNumber.toLowerCase().includes(q) ||
          b.buyer?.name?.toLowerCase().includes(q) ||
          b.buyer?.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [bills, filterStatus, searchQuery]);

const addItemToBill = (payload) => {
  setItems((prev) => {
    const upsert = (acc, it) => {
      const orderKey = String(it.orderId || 'manual');
      const keyId = it.sku || it.productId || it._id || Math.random().toString();
      const compositeKey = `${orderKey}::${keyId}`;

      const qty = Math.max(1, Number(it.qty ?? it.quantity ?? 1));
      const price = Number(it.price ?? 0);
      const lineTotal = Number(it.lineTotal || it.total || price * qty);

      const existingIndex = acc.findIndex((x) => {
        const xKey = String(x.orderId || 'manual');
        const xId = x.sku || x.productId || x._id;
        return `${xKey}::${xId}` === compositeKey;
      });

      if (existingIndex > -1) {
        const existing = acc[existingIndex];
        const newQty = existing.qty + qty;
        acc[existingIndex] = {
          ...existing,
          qty: newQty,
          price: price,
          total: newQty * price,
          lineTotal: newQty * price,
        };
      } else {
        acc.push({
          ...it,
          qty,
          price,
          total: lineTotal,
          lineTotal,
          itemName: it.itemName || it.name || 'Item',
        });
      }
      return acc;
    };

    if (Array.isArray(payload)) {
      return payload.reduce(upsert, [...prev]);
    }
    return upsert([...prev], payload);
  });
};

  const updateQty = (index, qty) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const raw = Number(qty) || 1;

        const maxQty =
          typeof item.availableQty === 'number' && item.availableQty > 0
            ? item.availableQty
            : raw; // if no availableQty, don't clamp by stock

        const safeQty = Math.max(1, Math.min(raw, maxQty));

        return {
          ...item,
          qty: safeQty,
          lineTotal: safeQty * Number(item.price || 0),
        };
      })
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const p = Number(discountPercent) || 0;
    return (subtotal * p) / 100;
  }, [subtotal, discountPercent]);

  const taxAmount = useMemo(() => {
    const taxableBase = Math.max(subtotal - discountAmount, 0);
    return (taxableBase * (Number(taxPercent) || 0)) / 100;
  }, [subtotal, discountAmount, taxPercent]);

  const grandTotal = useMemo(() => {
    const taxableBase = Math.max(subtotal - discountAmount, 0);
    return taxableBase + taxAmount;
  }, [subtotal, discountAmount, taxAmount]);

const handleCreateBill = async () => {
  if (creating || items.length === 0) return;
  setCreating(true);

  try {
    const hasOrder = items.some(i => i.orderId);
    const orderId = hasOrder ? String(items.find(i => i.orderId).orderId) : null;

    const manualItems = items
      .filter(i => !i.orderId)
      .map(i => ({
        productId: String(i.productId || i._id),
        itemName: i.itemName || i.name,
        qty: Number(i.qty || 1),
        price: Number(i.price || 0),
        lineTotal: Number(i.lineTotal || i.total || i.price * i.qty),
      }));

    const payload = {
      // Always send orderId if present
      ...(hasOrder && { orderId }),

      // Always send manual items if present
      ...(manualItems.length > 0 && { items: manualItems }),

      buyer: Object.values(buyer).some(v => v?.trim()) ? buyer : undefined,
      discountPercent: Number(discountPercent) || 0,
      notes: notes.trim() || undefined,
      paymentMethod: toBackendPaymentMethod(paymentMethod),
      ...(paymentMethod !== PAYMENT_METHODS.CASH && paymentNumber?.trim() && {
        paymentNumber: paymentNumber.trim(),
      }),
    };

    console.log("Sending mixed bill payload:", payload);
    await createBill(payload).unwrap();

    onReset();
    setIsCreateDialogOpen(false);
    refetchBills();

  } catch (err) {
    console.error(err);
    alert(err?.data?.message || "Failed to create bill");
  } finally {
    setCreating(false);
  }
};

  const handleDelete = async (billId) => {
    try {
      await softDeleteBill(billId).unwrap();
      refetchBills();
    } catch (error) {
      console.error(
        'Failed to delete bill:',
        error?.data?.message || error.message
      );
    }
  };

  // Accept lower/upper-cased IDs from UI, output only the expected fields
  const toRefundItem = (src) => {
    const productId = src?.productId || src?.ProductId;
    const orderItemId = src?.orderItemId || src?.OrderItemId;
    const quantity = Number(src?.quantity ?? 0);
    const reason = src?.reason || '';

    return {
      ...(productId ? { productId: String(productId) } : {}),
      ...(orderItemId ? { orderItemId: String(orderItemId) } : {}),
      quantity,
      ...(reason ? { reason } : {}),
    };
  };

  const buildRefundPayload = (bill, refundData) => {
    const billId = bill?._id ? String(bill._id) : '';
    const lines = Array.isArray(refundData?.lines) ? refundData.lines : [];

    const refundItems = lines
      .map(toRefundItem)
      .filter((r) => (r.productId || r.orderItemId) && r.quantity > 0); // must have an ID + qty>0

    return { billId, notes: refundData?.notes || '', refundItems };
  };

  const handleRefund = async (bill, refundData) => {
    try {
      setRefunding(true);
      const payload = buildRefundPayload(bill, refundData);
      console.log('payload', payload);
      if (!payload.billId) return alert('No bill id provided');
      if (!payload.refundItems.length)
        return alert('Select at least one item to refund');

      await updateBillStatus({
        billId: payload.billId, // goes in URL
        notes: payload.notes, // body
        refundItems: payload.refundItems, // body
      }).unwrap();

      refetchBills();
      setIsRefundDialogOpen(false);
    } catch (e) {
      console.error('Failed to process refund:', e?.data?.message || e.message);
      alert(e?.data?.message || e?.data?.error || e.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };
  const onReset = () => {
    setItems([]);
    setBuyer({ name: '', email: '', phone: '' });
    setNotes('');
    setPaymentNumber('');
    setPaymentMethod(PAYMENT_METHODS.CASH);
    setTaxPercent(taxRates.taxRateCash);
    setDiscountPercent(0); // 👈 reset discount
  };

  return (
    <div>
      <Header
        onCreate={() => setIsCreateDialogOpen(true)}
        addPermission={true}
      />
      <div className="mx-auto px-6 py-4">
        <StatsCards summary={summary} currencySymbol={currencySymbol} />
        <FilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="bg-card border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => (
                <BillRow
                  key={bill._id}
                  bill={bill}
                  expanded={expandedRows[bill._id]}
                  onToggleExpand={() =>
                    setExpandedRows((prev) => ({
                      ...prev,
                      [bill._id]: !prev[bill._id],
                    }))
                  }
                  onEdit={(bill, type) => {
                    setSelectedBill(bill); // 👉 makes !!selectedBill = true
                    setRefundType(type);
                    setIsRefundDialogOpen(true);
                  }}
                  onDelete={handleDelete}
                  onView={() => setDetailsBill(bill)}
                  updatePermission={true}
                  deletePermission={true}
                  currencySymbol={currencySymbol}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <BillDetailsSheet
        open={!!detailsBill} // ✅ controlled by detailsBill
        onOpenChange={(open) => {
          if (!open) setDetailsBill(null); // close sheet
        }}
        bill={detailsBill}
        totalRefundQty={detailsBill?.items?.reduce(
          // ✅ use detailsBill here too
          (sum, item) =>
            sum +
            (item.refundHistory?.reduce(
              (s, r) => s + (r.refundQuantity || 0),
              0
            ) || 0),
          0
        )}
        currencySymbol={currencySymbol}
      />

      <CreateBillDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        creating={creating}
        searchRef={searchRef}
        searchProduct={searchProduct}
        setSearchProduct={setSearchProduct}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        productLoading={productsLoading}
        searchResults={products.data}
        addItemToBill={addItemToBill}
        items={items}
        setItems={setItems}
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
        onSave={handleCreateBill}
        onReset={onReset}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentNumber={paymentNumber}
        setPaymentNumber={setPaymentNumber}
        companyId={companyId}
        taxRates={taxRates}
        companyLoading={companyLoading}
        currencySymbol={currencySymbol}
        discountPercent={discountPercent}
        discountAmount={discountAmount}
        setDiscountPercent={setDiscountPercent}
      />
      <RefundDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        bill={selectedBill}
        onRefund={handleRefund}
        refunding={refunding}
        refundType={refundType}
        currencySymbol={currencySymbol}
      />

      {detailsBill && (
        <ThermalPrintSlip bill={detailsBill} currencySymbol={currencySymbol} />
      )}
    </div>
  );
}