// Modified: CreateBillDialog.jsx (passed items to BillItemsSection for hasExistingOrder check, minor prop updates)
'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Loader2, Printer } from 'lucide-react';
import PropTypes from 'prop-types';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';
import { useGetOrdersQuery } from '@/features/orderApi';
import { useGetAllProductsQuery } from '@/features/productApi';
import CreateNewOrderInBill from './createNewOrderInBill';
import BillItemsSection from './BillItemsSection';
import BillDetailsSection from './BillDetailsSection';
import BillActionsFooter from './BillActionsFooter';

CreateBillDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  creating: PropTypes.bool.isRequired,
  searchRef: PropTypes.object,
  searchProduct: PropTypes.string.isRequired,
  setSearchProduct: PropTypes.func.isRequired,
  showSearchResults: PropTypes.bool.isRequired,
  setShowSearchResults: PropTypes.func.isRequired,
  addItemToBill: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  updateQty: PropTypes.func.isRequired,
  removeItem: PropTypes.func.isRequired,
  buyer: PropTypes.object.isRequired,
  setBuyer: PropTypes.func.isRequired,
  taxPercent: PropTypes.number.isRequired,
  setTaxPercent: PropTypes.func.isRequired,
  notes: PropTypes.string.isRequired,
  setNotes: PropTypes.func.isRequired,
  subtotal: PropTypes.number.isRequired,
  taxAmount: PropTypes.number.isRequired,
  grandTotal: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  setPaymentMethod: PropTypes.func.isRequired,
  paymentNumber: PropTypes.string,
  setPaymentNumber: PropTypes.func,
  taxRates: PropTypes.object,
  currencySymbol: PropTypes.string,
  discountPercent: PropTypes.number,
  discountAmount: PropTypes.number,
  setDiscountPercent: PropTypes.func,
};

export function CreateBillDialog({
  open,
  onOpenChange,
  creating,
  searchRef,
  searchProduct,
  setSearchProduct,
  showSearchResults,
  setShowSearchResults,
  addItemToBill,
  items,
  updateQty,
  removeItem,
  buyer,
  setBuyer,
  taxPercent,
  setTaxPercent,
  notes,
  setNotes,
  subtotal,
  taxAmount,
  grandTotal,
  onSave,
  onReset,
  paymentMethod,
  setPaymentMethod,
  paymentNumber,
  setPaymentNumber,
  taxRates,
  currencySymbol = '€',
  discountPercent = 0,
  discountAmount = 0,
  setDiscountPercent,
}) {
  const [buyerTouched, setBuyerTouched] = useState(false);
  const [orderId, setOrderId] = useState([]);

  const { data: ordersResp, isLoading: ordersLoading, refetch } = useGetOrdersQuery();
  const { data: productsResp, isLoading: productsLoading } = useGetAllProductsQuery();

  const allOrders = useMemo(() => {
    return Array.isArray(ordersResp?.data) ? ordersResp.data : (ordersResp || []);
  }, [ordersResp]);

  const allProducts = useMemo(() => {
    return Array.isArray(productsResp?.data) ? productsResp.data : (productsResp || []);
  }, [productsResp]);

  // Auto-switch tax when payment method changes
  useEffect(() => {
    if (paymentMethod === PAYMENT_METHODS.CASH) {
      setTaxPercent(taxRates?.taxRateCash);
    } else {
      setTaxPercent(taxRates?.taxRateCard);
    }
  }, [paymentMethod, taxRates, setTaxPercent]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [searchRef, setShowSearchResults]);

  const extractBuyerFromOrder = (order) => {
    return {
      name: order?.customerName || order?.buyer?.name || '',
      phone: order?.customerPhone || order?.buyer?.phone || '',
      email: order?.buyer?.email || '',
    };
  };

  const addOrderToBill = (order) => {
    if (!order?.items?.length) return;
if (items.length > 0 && !items[0].orderId) {
    if (!confirm("This will clear manually added items. Continue?")) return;
    addItemToBill([]); // clear manual items
  }
    if (!buyerTouched) {
      const inferred = extractBuyerFromOrder(order);
      if (inferred.name || inferred.phone) {
        setBuyer(prev => ({ ...prev, ...inferred }));
        setBuyerTouched(true);
      }
    }

    order.items.forEach(it => {
      addItemToBill({
        ...it,
        itemName: it.name,
        orderId: order._id,
        orderNo: order.orderNo,
        qty: it.qty,
        price: it.price,
        total: it.total,
      });
    });
    setShowSearchResults(false);
    setSearchProduct('');
  };

  const addProductToBill = (product) => {
  // If any item has orderId → block manual add
  if (items.some(item => item.orderId)) {
    alert("Cannot add manual items when an order is selected.");
    return;
  }

  addItemToBill({
    productId: product._id,
    itemName: product.productName || product.name,
    price: product.sellingPrice || product.price || 0,
    qty: 1,
    total: product.sellingPrice || product.price || 0,
  });
  setShowSearchResults(false);
  setSearchProduct('');
};

  const handleSaveAndPrint = async () => {
    const result = await onSave();
    if (!result) return;

    const printWindow = window.open('', '_blank');
    const content = `
<!DOCTYPE html>
<html><head><style>
  body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10mm; font-size: 12px; }
  .center { text-align: center; }
  .line { border-top: 2px dashed #000; margin: 10px 0; }
  .bold { font-weight: bold; }
  .large { font-size: 1.4em; }
</style></head><body>
  <div class="center bold large">YOUR RESTAURANT</div>
  <div class="center">Tax ID: 123456789</div>
  <div class="line"></div>
  <div>Bill #: <b>#${result.billNumber}</b></div>
  <div>Date: ${new Date().toLocaleString()}</div>
  <div class="line"></div>
  ${items.map(i => `
    <div style="display:flex;justify-content:space-between">
      <span>${i.qty}x ${i.itemName}</span>
      <span>${currencySymbol}${Number(i.total).toFixed(2)}</span>
    </div>`).join('')}
  <div class="line"></div>
  <div style="display:flex;justify-content:space-between" class="bold large">
    <span>TOTAL</span>
    <span>${currencySymbol}${grandTotal.toFixed(2)}</span>
  </div>
  <div class="line"></div>
  <div class="center">Thank You!</div>
</body></html>`;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[70rem] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl">Create New Bill</DialogTitle>
          <DialogDescription>Search orders or products to add items quickly</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BillItemsSection
            currencySymbol={currencySymbol}
            items={items}
            removeItem={removeItem}
            updateQty={updateQty}
            searchRef={searchRef}
            searchProduct={searchProduct}
            setSearchProduct={setSearchProduct}
            showSearchResults={showSearchResults}
            setShowSearchResults={setShowSearchResults}
            ordersLoading={ordersLoading}
            productsLoading={productsLoading}
            filteredOrders={allOrders.filter(o => o.paymentStatus === 'unpaid')}
            filteredProducts={allProducts}
            addOrderToBill={addOrderToBill}
            addProductToBill={addProductToBill}
            CreateNewOrderInBill={CreateNewOrderInBill}
            extractBuyerFromOrder={extractBuyerFromOrder}
            buyerTouched={buyerTouched}
            setBuyerTouched={setBuyerTouched}
            setBuyer={setBuyer}
            refetchOrders={refetch}
          />

          <div className="space-y-6">
            <BillDetailsSection
              buyer={buyer}
              setBuyer={setBuyer}
              buyerTouched={buyerTouched}
              setBuyerTouched={setBuyerTouched}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentNumber={paymentNumber}
              setPaymentNumber={setPaymentNumber}
              notes={notes}
              setNotes={setNotes}
              subtotal={subtotal}
              taxPercent={taxPercent}
              taxAmount={taxAmount}
              grandTotal={grandTotal}
              discountPercent={discountPercent}
              discountAmount={discountAmount}
              setDiscountPercent={setDiscountPercent}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className="border-t bg-background p-4 flex justify-end gap-3 sticky bottom-0">
          <Button variant="outline" onClick={onReset}>Reset</Button>
          <Button
            size="lg"
            onClick={onSave}
            disabled={creating || items.length === 0}
          >
            {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Bill'}
          </Button>
          <Button
            size="lg"
            variant="default"
            onClick={handleSaveAndPrint}
            disabled={creating || items.length === 0}
          >
            <Printer className="mr-2 h-5 w-5" />
            Save & Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}