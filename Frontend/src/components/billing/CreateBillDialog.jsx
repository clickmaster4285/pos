'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader, Printer, CreditCard } from 'lucide-react';
import PropTypes from 'prop-types';

import { useClickOutside } from '@/utils/useClickOutside';
import { useDebounce } from '@/utils/useDebounce';
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

  searchRef: PropTypes.shape({ current: PropTypes.any }),
  searchProduct: PropTypes.string.isRequired,
  setSearchProduct: PropTypes.func.isRequired,
  showSearchResults: PropTypes.bool.isRequired,
  setShowSearchResults: PropTypes.func.isRequired,

  addItemToBill: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateQty: PropTypes.func.isRequired,
  removeItem: PropTypes.func.isRequired,

  buyer: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }).isRequired,
  setBuyer: PropTypes.func.isRequired,

  taxPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
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
  companyId: PropTypes.string,
  taxRates: PropTypes.shape({
    taxRateCash: PropTypes.number,
    taxRateCard: PropTypes.number,
  }),
  companyLoading: PropTypes.bool,
  currencySymbol: PropTypes.string,
  discountPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
  companyId,
  taxRates,
  companyLoading,
  currencySymbol,
  discountPercent,
  discountAmount,
  setDiscountPercent,

}) {
  const [buyerTouched, setBuyerTouched] = useState(false);
  const [orderId, setOrderId] = useState([]);

  const {
    data: ordersResp,
    isLoading: ordersLoading,
    isFetching: isValidatingOrders,
    refetch,
  } = useGetOrdersQuery();

  const {
    data: productsResp,
    isLoading: productsLoading,
    isFetching: isValidatingProducts,
  } = useGetAllProductsQuery();

  // normalize orders array
  const allOrders = useMemo(() => {
    if (Array.isArray(ordersResp?.data)) return ordersResp.data;
    if (Array.isArray(ordersResp)) return ordersResp;
    return [];
  }, [ordersResp]);

  // normalize products array
  const allProducts = useMemo(() => {
    if (Array.isArray(productsResp?.data)) return productsResp.data;
    if (Array.isArray(productsResp)) return productsResp;
    return [];
  }, [productsResp]);

  const extractBuyerFromOrder = (orderObj) => {
    const name =
      orderObj?.customerName ||
      orderObj?.buyer?.name ||
      orderObj?.user?.name ||
      '';
    const phone =
      orderObj?.customerPhone ||
      orderObj?.buyer?.phone ||
      orderObj?.user?.phone ||
      '';
    return { name, phone };
  };

  const debouncedSearch = useDebounce(searchProduct, 300);

  // Orders filter
  const filteredOrders = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();

    const base = allOrders.filter((o) => {
      const status = String(o?.paymentStatus || '').toLowerCase();
      const id = String(o?._id || '');
      return (
        status === 'unpaid' &&
        (orderId.length === 0 || orderId.includes(id)) &&
        (o?.items?.length ?? 0) > 0
      );
    });

    if (!q) return base;

    return base.filter((o) => {
      const orderNo = String(o.orderNo || o.orderNumber || '').toLowerCase();
      const customer = String(o.customerName || '').toLowerCase();
      return orderNo.includes(q) || customer.includes(q);
    });
  }, [allOrders, debouncedSearch, orderId]);

  // Products filter
  const filteredProducts = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();
    if (!q) return allProducts.slice(0, 20);

    return allProducts.filter((p) => {
      const name = String(p.productName || p.name || '').toLowerCase();
      const sku = String(p.SKU || p.sku || '').toLowerCase();
      return name.includes(q) || sku.includes(q);
    });
  }, [allProducts, debouncedSearch]);

  // When items change, sync orderId
  useEffect(() => {
    const first =
      (items ?? []).map((it) => String(it.orderId || '')).find(Boolean) || '';
    setOrderId((prev) => {
      if (!first) return [];
      if (Array.isArray(prev) && prev.includes(first)) return prev;
      return first ? [first] : [];
    });
  }, [items]);

  useClickOutside(searchRef, () => setShowSearchResults(false));

  // tax rate by payment method
  useEffect(() => {
    if (!taxRates) {
      setTaxPercent(0);
      return;
    }
    if (paymentMethod === PAYMENT_METHODS.CASH)
      setTaxPercent(taxRates.taxRateCash ?? 0);
    else if (
      paymentMethod === PAYMENT_METHODS.CREDIT_CARD ||
      paymentMethod === PAYMENT_METHODS.BANK_TRANSFER
    )
      setTaxPercent(taxRates.taxRateCard ?? 0);
    else setTaxPercent(0);
  }, [paymentMethod, taxRates, setTaxPercent]);

  const buyerDetailsRequired =
    paymentMethod === PAYMENT_METHODS.CREDIT_CARD ||
    paymentMethod === PAYMENT_METHODS.BANK_TRANSFER;

  const isBuyerDetailsValid = useMemo(() => {
    if (!buyerDetailsRequired) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      !!buyer.name?.trim() &&
      emailRegex.test(buyer.email?.trim()) &&
      !!buyer.phone?.trim() &&
      !!paymentNumber?.trim()
    );
  }, [buyer, buyerDetailsRequired, paymentNumber]);

  const draftBill = useMemo(
    () => ({
      _id: 'PREVIEW',
      billNumber: '(Preview)',
      createdAt: new Date().toISOString(),
      buyer,
      companyId,
      orderId,
      items: items.map((it) => ({
        productId: it.productId,
        orderItemId: it.orderItemId || undefined,
        itemName: it.itemName,
        categoryName: it.categoryName,
        subCategory: it.subCategory,
        quantity: it.qty,
        price: it.price,
        total: it.lineTotal,
        orderId: it.orderId || undefined,
      })),
      subtotal,
      // 👇 NEW
      discountPercent: Number(discountPercent) || 0,
      discountAmount: Number(discountAmount) || 0,
      // ------
      taxPercent: Number(taxPercent || 0),
      taxAmount,
      total: grandTotal,
      paymentMethod,
      paymentNumber,
      notes,
      status: paymentMethod === PAYMENT_METHODS.CASH ? 'paid' : 'pending',
    }),
    [
      buyer,
      companyId,
      orderId,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      grandTotal,
      paymentMethod,
      paymentNumber,
      notes,
    ]
  );

  // inject an order’s items into the bill
  const addOrderToBill = (order) => {
    if (!order?.items?.length) return;

    const id = String(order._id || '');
    if (!id) return;

    if (orderId.length > 0 && !orderId.includes(id)) {
      alert('You can only add items from one order per bill.');
      return;
    }

    if (!buyerTouched) {
      const inferred = extractBuyerFromOrder(order);
      if (
        (inferred.name && !buyer?.name) ||
        (inferred.phone && !buyer?.phone)
      ) {
        setBuyer({
          name: buyer?.name || inferred.name || '',
          phone: buyer?.phone || inferred.phone || '',
          email: buyer?.email || '',
        });
      }
    }

    if (orderId.includes(id)) return;

    const orderNo = order.orderNo || order.orderNumber || '';

    const batch = order.items.map((it) => {
      const qty = Number(it.qty ?? it.quantity ?? 1);
      const price = Number(it.price ?? 0);
      const productId =
        it.productId ||
        it.product?._id ||
        it.product ||
        it.pid ||
        it.dynamicAttributes?.productId ||
        '';

      return {
        productId,
        orderItemId: String(it._id || it.id || ''),
        sku: orderNo,
        itemName: it.name || it.itemName || 'Item',
        categoryName: it.categoryName || '',
        subCategory: it.subCategory || '',
        qty,
        price,
        lineTotal: qty * price,
        orderId: String(order._id || ''),
        orderNo,
      };
    });

    addItemToBill(batch);
    setOrderId((prev) => (Array.isArray(prev) ? [...prev, id] : [id]));
    setShowSearchResults(false);
    setSearchProduct('');
  };

  // add a product directly to the bill
  const addProductToBill = (product) => {
    if (!product) return;

    const qty = 1;
    const price = Number(product.sellingPrice ?? product.price ?? 0);

    const lineItem = {
      productId: product._id,
      orderItemId: undefined,
      sku: product.SKU || product.sku || '',
      itemName: product.productName || product.name || 'Product',
      categoryName: product.categoryName || product.category || '',
      subCategory: product.subCategoryName || '',
      qty,
      price,
      lineTotal: qty * price,
      orderId: null,
      orderNo: '',
    };

    addItemToBill([lineItem]);
    setShowSearchResults(false);
    setSearchProduct('');
  };

  const handleSave = async () => {
    try {
      await onSave?.(draftBill);
      await refetch();
      onReset?.();
      onOpenChange?.(false);
    } catch (e) {
      console.error('Save bill failed:', e);
    }
  };

  const handleSaveAndPrint = async () => {
    await onSave?.(draftBill);
    await refetch();
    const printWindow = window.open('', '_blank');
    const formattedContent = [
      '==============================',
      `Bill #${draftBill.billNumber}`,
      `Date: ${new Date(draftBill.createdAt).toLocaleString()}`,
      '==============================',
      'Items:',
      ...draftBill.items.flatMap((item) => [
        `${item.quantity}x ${item.itemName}`,
        `  ${currencySymbol}${Number(item.price || 0).toFixed(2)} x ${
          item.quantity
        } = ${currencySymbol}${Number(item.total || 0).toFixed(2)}`,
      ]),
      '==============================',
      `Subtotal: ${currencySymbol}${Number(draftBill.subtotal || 0).toFixed(
        2
      )}`,
      `Tax (${draftBill.taxPercent}%): ${currencySymbol}${Number(
        draftBill.taxAmount || 0
      ).toFixed(2)}`,
      `Total: ${currencySymbol}${Number(draftBill.total || 0).toFixed(2)}`,
      '==============================',
      'Buyer:',
      `  Name: ${draftBill.buyer?.name || '—'}`,
      `  Email: ${draftBill.buyer?.email || '—'}`,
      `  Phone: ${draftBill.buyer?.phone || '—'}`,
      `Payment: ${draftBill.paymentMethod.replace('_', ' ')}`,
      ...(draftBill.paymentNumber ? [`  Ref: ${draftBill.paymentNumber}`] : []),
      '==============================',
      'Thank you for your purchase!',
    ].join('\n');
    printWindow.document.write(`
      <pre style="font-family: monospace; font-size: 12px; line-height: 1.2;">
${formattedContent}
      </pre>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="min-w-[70rem] max-h-[90vh] overflow-y-auto"
        aria-describedby="create-bill-description"
      >
        <DialogHeader>
          <DialogTitle>Create New Bill (from Orders / Products)</DialogTitle>
          <DialogDescription id="create-bill-description">
            Search existing orders or products and add their items to this bill.
            Then enter buyer and payment details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              isValidatingOrders={isValidatingOrders}
              productsLoading={productsLoading}
              isValidatingProducts={isValidatingProducts}
              filteredOrders={filteredOrders}
              filteredProducts={filteredProducts}
              addOrderToBill={addOrderToBill}
              addProductToBill={addProductToBill}
              CreateNewOrderInBill={CreateNewOrderInBill}
              extractBuyerFromOrder={extractBuyerFromOrder}
              buyerTouched={buyerTouched}
              setBuyerTouched={setBuyerTouched}
              setBuyer={setBuyer}
              refetchOrders={refetch}
            />

            <BillDetailsSection
              buyer={buyer}
              setBuyer={setBuyer}
              buyerTouched={buyerTouched}
              setBuyerTouched={setBuyerTouched}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentNumber={paymentNumber}
              setPaymentNumber={setPaymentNumber}
              buyerDetailsRequired={buyerDetailsRequired}
              notes={notes}
              setNotes={setNotes}
              subtotal={subtotal}
              taxPercent={taxPercent}
              taxAmount={taxAmount}
              grandTotal={grandTotal}
              currencySymbol={currencySymbol}
              discountPercent={discountPercent}
              discountAmount={discountAmount}
              setDiscountPercent={setDiscountPercent}
            />
          </div>

          <BillActionsFooter
            onOpenChange={onOpenChange}
            onReset={onReset}
            setOrderId={setOrderId}
            handleSaveAndPrint={handleSaveAndPrint}
            handleSave={handleSave}
            creating={creating}
            itemsLength={items.length}
            isBuyerDetailsValid={isBuyerDetailsValid}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
