'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Trash2,
  Printer,
  CreditCard,
  Loader,
  Plus,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useClickOutside } from '@/utils/useClickOutside';
import { useDebounce } from '@/utils/useDebounce';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';
import { useGetOrdersQuery } from '@/features/orderApi';
import CreateNewOrderInBill from './createNewOrderInBill';

CreateBillDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  creating: PropTypes.bool.isRequired,

  // we’ll reuse these for ORDER search
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
}) {
  const [buyerTouched, setBuyerTouched] = useState(false);
  const [orderId, setOrderId] = useState([]);

  const {
    data: ordersResp,
    isLoading: ordersLoading,
    isFetching: isValidatingOrders,
    refetch,
  } = useGetOrdersQuery();

  // normalize orders array
  const allOrders = useMemo(() => {
    if (Array.isArray(ordersResp?.data)) return ordersResp.data;
    if (Array.isArray(ordersResp)) return ordersResp;
    return [];
  }, [ordersResp]);

  const extractBuyerFromOrder = (allOrders) => {
    const name =
      allOrders?.customerName ||
      allOrders?.buyer?.name ||
      allOrders?.user?.name ||
      '';
    const phone =
      allOrders?.customerPhone ||
      allOrders?.buyer?.phone ||
      allOrders?.user?.phone ||
      '';
    return { name, phone };
  };

  //--------------------------------------------

  const debouncedSearch = useDebounce(searchProduct, 300);

  // ✅ Only show UNPAID orders that are NOT already added
  const filteredOrders = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();

    const base = allOrders.filter((o) => {
      const status = String(o?.paymentStatus || '').toLowerCase();
      const id = String(o?._id || '');
      return (
        status == 'unpaid' &&
        (!orderId || orderId === id) && // allow only the picked one
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

  // ✅ When items change, drop any orderId that no longer exist in items
  useEffect(() => {
    // find any orderId present in items
    const first =
      (items ?? []).map((it) => String(it.orderId || '')).find(Boolean) || '';
    setOrderId((prev) => (prev && first && prev !== first ? prev : first));
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

  const buyerDetailsRequired = useMemo(
    () =>
      paymentMethod === PAYMENT_METHODS.CREDIT_CARD ||
      paymentMethod === PAYMENT_METHODS.BANK_TRANSFER,
    [paymentMethod]
  );

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
      orderId, // ✅ single order id for backend
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

    if (orderId && orderId !== id) {
      // Optional: show a toast instead
      alert('You can only add items from one order per bill.');
      return;
    }
    // ⬇️ NEW: auto-fill buyer if user hasn't edited yet
    if (!buyerTouched) {
      const inferred = extractBuyerFromOrder(order);
      // only set if we actually have something useful
      if (
        (inferred.name && !buyer?.name) ||
        (inferred.phone && !buyer?.phone)
      ) {
        setBuyer({
          name: buyer?.name || inferred.name || '',
          phone: buyer?.phone || inferred.phone || '',
        });
      }
    }

    const id = String(order._id || '');
    if (!id || orderId.includes(id)) return; // block duplicates

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

    addItemToBill(batch); // one state update
    setOrderId((p) => [...p, id]);
    setShowSearchResults(false);
    setSearchProduct('');
  };

  const handleSave = async () => {
    try {
      await onSave?.(draftBill);
      await refetch(); // ✅ refresh orders after successful save
      onReset?.(); // optional: clear the form
      onOpenChange?.(false); // optional: close dialog
    } catch (e) {
      // keep your toast/log if you use one
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
          <DialogTitle>Create New Bill (from Orders)</DialogTitle>
          <DialogDescription id="create-bill-description">
            Search existing orders and add their items to this bill. Then enter
            buyer and payment details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>
                    Search orders and import their items.
                  </CardDescription>
                </div>
                <CreateNewOrderInBill
                  onCreated={async (created) => {
                    if (created?.items?.length) {
                      if (!buyerTouched) {
                        const inferred = extractBuyerFromOrder(created);
                        if (inferred.name || inferred.phone) {
                          setBuyer({
                            name: buyer?.name || inferred.name || '',
                            email: buyer?.email || '',
                            phone: buyer?.phone || inferred.phone || '',
                          });
                        }
                      }
                      addOrderToBill(created);
                      return;
                    }
                    // Otherwise refetch list and find it by id
                    try {
                      const refreshed = await refetch().unwrap();
                      const list = Array.isArray(refreshed?.data)
                        ? refreshed.data
                        : Array.isArray(refreshed)
                        ? refreshed
                        : [];
                      const id = String(created?._id || created?.id || '');
                      const full = list.find((o) => String(o?._id) === id);

                      if (full) {
                        if (!buyerTouched) {
                          const inferred = extractBuyerFromOrder(full);
                          if (inferred.name || inferred.phone) {
                            setBuyer({
                              name: buyer?.name || inferred.name || '',
                              email: buyer?.email || '',
                              phone: buyer?.phone || inferred.phone || '',
                            });
                          }
                        }
                        addOrderToBill(full);
                      }
                    } catch (e) {
                      console.error('Refetch after create failed', e);
                    }
                  }}
                />
              </CardHeader>

              <CardContent>
                {/* Orders search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    placeholder="Search orders by Order No. or Customer…"
                    value={searchProduct}
                    onChange={(e) => {
                      setSearchProduct(e.target.value);
                      setShowSearchResults(true);
                    }}
                    className="pl-10"
                    onFocus={() => setShowSearchResults(true)}
                  />
                  {showSearchResults && (
                    <div className="absolute z-10 mt-2 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {ordersLoading || isValidatingOrders ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Loading orders…
                        </div>
                      ) : filteredOrders.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No matching orders
                        </div>
                      ) : (
                        filteredOrders.map((order) => (
                          <div
                            key={order._id}
                            className="px-4 py-2 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                            onMouseDown={() => addOrderToBill(order)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {order.orderNo || '(Order)'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {order.customerName
                                    ? `Customer: ${order.customerName} · `
                                    : ''}
                                  Items: {order.items?.length || 0} · Total:{' '}
                                  {currencySymbol}
                                  {Number(order.subTotal || 0).toFixed(
                                    2
                                  )} ·{' '}
                                  {String(
                                    order.paymentStatus || 'unpaid'
                                  ).toUpperCase()}
                                </p>
                              </div>
                              <span className="text-[11px] rounded px-2 py-0.5 bg-muted text-muted-foreground shrink-0">
                                {(order.orderStatus || 'pending').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Items table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Price</TableHead>

                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No items added
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={`${item.productId || 'i'}-${index}`}>
                          <TableCell>{item.itemName}</TableCell>

                          <TableCell>
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {item.orderId
                                ? item.orderNo
                                  ? `Order ${item.orderNo}`
                                  : `Order ${String(item.orderId).slice(-6)}`
                                : 'Manual'}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            {Number(item.qty || 0)}
                          </TableCell>
                          <TableCell>{currencySymbol}</TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}
                            {Number(item.price).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              aria-label={`Remove ${item.itemName}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Bill details */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
                <CardDescription>
                  Enter buyer and payment details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ...unchanged details form... */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="buyer-name"
                  >
                    Buyer Name{' '}
                    {buyerDetailsRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <Input
                    id="buyer-name"
                    placeholder="John Doe"
                    value={buyer.name || ''}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyer({ ...buyer, name: e.target.value });
                    }}
                    required={buyerDetailsRequired}
                    aria-label="Buyer name"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="buyer-email"
                  >
                    Buyer Email
                  </label>
                  <Input
                    id="buyer-email"
                    placeholder="john.doe@example.com"
                    value={buyer.email || ''}
                    onChange={(e) =>
                      setBuyer({ ...buyer, email: e.target.value })
                    }
                    type="email"
                    aria-label="Buyer email"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="buyer-phone"
                  >
                    Buyer Phone
                  </label>
                  <Input
                    id="buyer-phone"
                    placeholder="+1234567890"
                    value={buyer.phone || ''}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyer({ ...buyer, phone: e.target.value });
                    }}
                    aria-label="Buyer phone"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="payment-method"
                  >
                    Payment Method
                  </label>
                  <select
                    id="payment-method"
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      if (
                        e.target.value === PAYMENT_METHODS.CASH &&
                        setPaymentNumber
                      ) {
                        setPaymentNumber('');
                      }
                    }}
                    aria-label="Payment method"
                  >
                    <option value={PAYMENT_METHODS.CASH}>Cash</option>
                    <option value={PAYMENT_METHODS.CREDIT_CARD}>
                      Credit Card
                    </option>
                    <option value={PAYMENT_METHODS.BANK_TRANSFER}>
                      Bank Transfer
                    </option>
                  </select>
                </div>

                {buyerDetailsRequired && (
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="payment-number"
                    >
                      {paymentMethod === PAYMENT_METHODS.CREDIT_CARD
                        ? 'Card Number'
                        : 'Bank Account Number'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="payment-number"
                      placeholder={
                        paymentMethod === PAYMENT_METHODS.CREDIT_CARD
                          ? '1234 5678 9012 3456'
                          : 'PK1234567890123456'
                      }
                      value={paymentNumber || ''}
                      onChange={(e) => setPaymentNumber?.(e.target.value)}
                      required
                      aria-label={
                        paymentMethod === PAYMENT_METHODS.CREDIT_CARD
                          ? 'Card number'
                          : 'Bank account number'
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="notes"
                  >
                    Notes
                  </label>
                  <Input
                    id="notes"
                    placeholder="Optional notes"
                    value={notes || ''}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Bill notes"
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({taxPercent || 0}%):
                    </span>
                    <span className="font-medium">
                      {currencySymbol}
                      {taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">
                      {currencySymbol}
                      {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                if (
                  window.confirm('Are you sure you want to reset all fields?')
                )
                  onReset();
                setOrderId([]);
              }}
            >
              Reset Form
            </Button>

            <Button
              variant="header"
              onClick={handleSaveAndPrint}
              disabled={creating || items.length === 0 || !isBuyerDetailsValid}
            >
              {creating ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              Save & Print Receipt
            </Button>

            <div className="relative">
              <Button
                onClick={handleSave}
                disabled={creating || items.length === 0}
              >
                {creating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                <CreditCard className="w-4 h-4 mr-2" />
                Save Bill
              </Button>

              {/* {!isBuyerDetailsValid && items.length > 0 && (
                <p className="text-sm text-red-500 mt-2 absolute">
                  Please fill in all required buyer details.
                </p>
              )} */}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
