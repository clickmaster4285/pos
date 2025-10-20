'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Header, StatsCards, FilterBar } from './billingHeader';
import { BillRow } from './billTable';
import BillDetailsSheet from './BillDetailsSheet';
import { CreateBillDialog } from './CreateBillDialog';
import { RefundDialog } from './RefundDialog';
import { ThermalPrintSlip } from './ThermalPrintSlip';
import { useGetBillsQuery, useCreateBillMutation } from '@/features/billingApi';
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

export default function BillingPage() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
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
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [companyId, setCompanyId] = useState(''); // TODO: Set from auth context
  const [taxRates, setTaxRates] = useState({ taxRateCash: 18, taxRateCard: 10 });
  const [companyLoading, setCompanyLoading] = useState(false);
  const searchRef = useRef(null);

  const { data: products = { data: [], pagination: {} }, isLoading: productsLoading } = useGetAllProductsQuery({ page: 1, limit: 100 });
  const { data: billsData, refetch: refetchBills } = useGetBillsQuery({ page: 1, limit: 100 });
  const [createBill] = useCreateBillMutation();
  const { data: company, isLoading: settingsLoading } = useGetCompanySettingsQuery();

  const settingsRaw = company?.invoiceSettings ?? {};
  const currencySymbol = settingsRaw?.currency?.symbol ?? company?.currency?.symbol ?? '€';

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

  const addItemToBill = (item) => {
    console.log("item: ", item);
    setItems((prev) => {
      const existingItem = prev.find((i) => i.sku === item.sku);
      if (existingItem) {
        return prev.map((i) =>
          i.sku === item.sku
            ? { ...i, qty: i.qty + 1, lineTotal: (i.qty + 1) * i.price }
            : i
        );
      }
      return [...prev, { ...item, qty: 1, lineTotal: item.price }];
    });
  };

  const updateQty = (index, qty) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              qty: Math.max(1, Math.min(qty, item.availableQty)),
              lineTotal: Math.max(1, Math.min(qty, item.availableQty)) * item.price,
            }
          : item
      )
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal * taxPercent) / 100;
  }, [subtotal, taxPercent]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const handleCreateBill = async (billData) => {
    try {
      setCreating(true);
      const payload = {
        ...billData,
        companyId,
        taxPercent,
        taxAmount,
        total: grandTotal,
      };
      await createBill(payload).unwrap();
      refetchBills();
      setIsCreateDialogOpen(false);
      onReset();
    } catch (error) {
      console.error('Failed to create bill:', error?.data?.message || error.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePrint = (bill) => {
    console.log('Printing bill:', bill.billNumber);
  };

  const handlePrintThermal = (bill) => {
    // This function will be passed to BillRow to trigger thermal printing
    console.log('Triggering thermal print for bill:', bill.billNumber);
  };

  const handleDelete = async (billId) => {
    try {
      await billsApi.useSoftDeleteBillMutation(billId);
      refetchBills();
      console.log('Bill deleted:', billId);
    } catch (error) {
      console.error('Failed to delete bill:', error?.data?.message || error.message);
    }
  };

  const handleRefund = async (bill, refundData) => {
    try {
      setRefunding(true);
      await billsApi.useUpdateBillStatusMutation({
        id: bill._id,
        ...refundData,
      });
      refetchBills();
      setIsRefundDialogOpen(false);
      console.log('Refund processed for bill:', bill.billNumber);
    } catch (error) {
      console.error('Failed to process refund:', error?.data?.message || error.message);
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
                    setSelectedBill(bill);
                    setRefundType(type);
                    setIsRefundDialogOpen(true);
                  }}
                  onPrint={handlePrint}
                  onPrintThermal={handlePrintThermal}
                  onDelete={handleDelete}
                  onView={() => setSelectedBill(bill)}
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
        open={!!selectedBill}
        onOpenChange={() => setSelectedBill(null)}
        bill={selectedBill}
        onPrint={handlePrint}
        totalRefundQty={selectedBill?.items?.reduce(
          (sum, item) =>
            sum +
            (item.refundHistory?.reduce((s, r) => s + (r.refundQuantity || 0), 0) || 0),
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
      {selectedBill && (
        <ThermalPrintSlip bill={selectedBill} currencySymbol={currencySymbol} />
      )}
    </div>
  );
}