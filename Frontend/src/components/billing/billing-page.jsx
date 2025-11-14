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

  // BillingPage.jsx
  const addItemToBill = (payload) => {
    setItems((prev) => {
      const upsert = (acc, it) => {
        const orderKey = String(it.orderId || 'manual');
        const skuKey = String(it.sku || it.productId || Math.random());
        const compositeKey = `${orderKey}::${skuKey}`;

        const qty = Math.max(1, Number(it.qty ?? 1));
        const price = Number(it.price ?? 0);

        const idx = acc.findIndex(
          (x) =>
            `${String(x.orderId || 'manual')}::${String(
              x.sku || x.productId
            )}` === compositeKey
        );

        if (idx !== -1) {
          const ex = acc[idx];
          const nextQty = Number(ex.qty || 0) + qty;
          acc[idx] = {
            ...ex,
            qty: nextQty,
            price,
            lineTotal: nextQty * price,
          };
          return acc;
        }

        acc.push({
          ...it,
          qty,
          price,
          lineTotal: qty * price,
        });
        return acc;
      };

      if (Array.isArray(payload)) return payload.reduce(upsert, [...prev]);
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

  const handleCreateBill = async (billData) => {
    try {
      setCreating(true);

      // 1) Collect orderIds from billData or items
      const orderIds = extractOrderIds(billData, billData?.items || items);

      if (orderIds.length > 1) {
        alert(
          'Only one order can be billed at a time. Please remove extra orders.'
        );
        return;
      }

      const orderId = orderIds[0] ? String(orderIds[0]) : undefined;

      // 2) Items to send (use what CreateBillDialog built in draftBill)
      const apiItems = Array.isArray(billData?.items) ? billData.items : [];

      if (!apiItems.length && !orderId) {
        alert('Please add at least one item or select an order.');
        return;
      }

      // 3) Build payload for controller (order bill, product bill, or mixed)
      const payload = {
        ...(orderId ? { orderId } : {}),
        items: apiItems, // controller handles qty/quantity & total/lineTotal
        buyer: {
          name: buyer?.name || '',
          email: buyer?.email || '',
          phone: buyer?.phone || '',
        },
        taxPercent: Number(taxPercent) || 0,
        discountPercent: Number(discountPercent) || 0,
        notes: notes || '',
        paymentMethod: toBackendPaymentMethod(paymentMethod),
        ...(paymentMethod !== PAYMENT_METHODS.CASH && paymentNumber
          ? { paymentNumber: String(paymentNumber) }
          : {}),
      };

      await createBill(payload).unwrap();
      refetchBills();
      setIsCreateDialogOpen(false);
      onReset();
    } catch (error) {
      console.error(
        'Failed to create bill:',
        error?.data?.message || error?.data?.error || error.message
      );
      alert(
        error?.data?.message ||
          error?.data?.error ||
          error.message ||
          'Failed to create bill'
      );
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
