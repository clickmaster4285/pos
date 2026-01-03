// CreateBillDialog.jsx — FULL REPLACED FILE (only logic fixed, UI 100% same)

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
  setItems: PropTypes.func.isRequired,
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
  setItems,
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

  const { data: ordersResp, isLoading: ordersLoading, refetch } = useGetOrdersQuery();
  const { data: productsResp, isLoading: productsLoading } = useGetAllProductsQuery();

  const allOrders = useMemo(() => {
    return Array.isArray(ordersResp?.data) ? ordersResp.data : (ordersResp || []);
  }, [ordersResp]);

  const allProducts = useMemo(() => {
    return Array.isArray(productsResp?.data) ? productsResp.data : (productsResp || []);
  }, [productsResp]);

  useEffect(() => {
    if (paymentMethod === PAYMENT_METHODS.CASH) {
      setTaxPercent(taxRates?.taxRateCash || 0);
    } else {
      setTaxPercent(taxRates?.taxRateCard || 0);
    }
  }, [paymentMethod, taxRates, setTaxPercent]);

  // FIXED: Add order safely — only one order allowed
  const addOrderToBill = (order) => {
    if (!order?.items?.length) return;

    const hasOrderAlready = items.some(i => i.orderId);

    if (hasOrderAlready) {
      alert("Only one order can be added to a bill.");
      return;
    }

    const orderItems = order.items.map(it => ({
      ...it,
      itemName: it.name || it.itemName || 'Item',
      orderId: order._id,
      orderNo: order.orderNo,
      qty: Number(it.qty || it.quantity || 1),
      price: Number(it.price || 0),
      total: Number(it.total || it.price * it.qty || 0),
      lineTotal: Number(it.total || it.price * it.qty || 0),
    }));

    setItems(orderItems);

    if (!buyerTouched) {
      const inferred = {
        name: order?.customerName || order?.buyer?.name || '',
        phone: order?.customerPhone || order?.buyer?.phone || '',
        email: order?.buyer?.email || '',
      };
      if (inferred.name || inferred.phone) {
        setBuyer(inferred);
        setBuyerTouched(true);
      }
    }

    setSearchProduct('');
    setShowSearchResults(false);
    if (searchRef.current) {
      searchRef.current.value = '';
    }
  };

  // FIXED: Add manual product with correct price
  const addProductToBill = (product) => {
    const price = Number(product.sellingPrice || product.price || 0);
    const name = product.productName || product.name || 'Product';

    addItemToBill({
      productId: product._id,
      itemName: name,
      sku: product.sku,
      price: price,
      qty: 1,
      total: price,
      lineTotal: price,
    });

    setSearchProduct('');
    setShowSearchResults(false);
    if (searchRef.current) {
      searchRef.current.value = '';
    }
  };

  const handleSaveAndPrint = () => {
    onSave();
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      const content = `<!DOCTYPE html>
<html><head><title>Bill</title>
<style>
  body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .large { font-size: 1.2em; }
  .line { border-top: 1px dashed #000; margin: 10px 0; }
</style>
</head><body>
  <div class="center bold large">YOUR RESTAURANT</div>
  <div class="center">Bill Receipt</div>
  <div class="line"></div>
  ${items.map(it => `
    <div style="display:flex;justify-content:space-between">
      <span>${it.qty}x ${it.itemName}</span>
      <span>${currencySymbol}${Number(it.total || it.lineTotal || 0).toFixed(2)}</span>
    </div>
  `).join('')}
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
    }, 500);
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
            extractBuyerFromOrder={(o) => ({
              name: o.customerName || '',
              phone: o.customerPhone || '',
              email: o.buyer?.email || '',
            })}
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