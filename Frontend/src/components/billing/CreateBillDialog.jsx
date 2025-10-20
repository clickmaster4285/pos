'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
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
  CheckCircle2,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useClickOutside } from '@/utils/useClickOutside';
import { useDebounce } from '@/utils/useDebounce';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';
import { useGetAllProductsQuery } from '@/features/productApi';

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
  taxPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
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
  currencySymbol = '€',
}) {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const debouncedSearchProduct = useDebounce(searchProduct, 300);
  const { data: products = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } }, isLoading: productsLoading } = useGetAllProductsQuery({ page: 1, limit: 100 });
  useClickOutside(searchRef, () => setShowSearchResults(false));

  // Update tax rate based on payment method
  useEffect(() => {
    if (taxRates) {
      if (paymentMethod === PAYMENT_METHODS.CASH) {
        setTaxPercent(taxRates.taxRateCash || 18);
      } else if (
        paymentMethod === PAYMENT_METHODS.CREDIT_CARD ||
        paymentMethod === PAYMENT_METHODS.BANK_TRANSFER
      ) {
        setTaxPercent(taxRates.taxRateCard || 10);
      } else {
        setTaxPercent(0);
      }
    }
  }, [paymentMethod, taxRates, setTaxPercent]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchProduct || showAllProducts) {
      return products.data;
    }
    const query = debouncedSearchProduct.toLowerCase();
    return products.data.filter(
      (p) =>
        p.productName.toLowerCase().includes(query) ||
        p.SKU.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query))
    );
  }, [debouncedSearchProduct, products.data, showAllProducts]);

  const isTaxRateSet = useMemo(() => {
    return taxRates?.taxRateCash > 0 || taxRates?.taxRateCard > 0;
  }, [taxRates]);

  const buyerDetailsRequired = useMemo(() => {
    return (
      paymentMethod === PAYMENT_METHODS.CREDIT_CARD ||
      paymentMethod === PAYMENT_METHODS.BANK_TRANSFER
    );
  }, [paymentMethod]);

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
      items: items.map((it) => ({
        productId: it.productId,
        sku: it.sku,
        itemName: it.itemName,
        categoryName: it.categoryName,
        subCategory: it.subCategory,
        quantity: it.qty,
        price: it.price,
        total: it.lineTotal,
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

  const handleSave = () => {
    if (!items.length) {
      alert('Please add at least one item.');
      return;
    }
    onSave?.(draftBill);
  };

  // Check if a product is already in the bill
  const isProductSelected = (productId) => {
    return items.some((item) => item.productId === productId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="min-w-[70rem] max-h-[90vh] overflow-y-auto"
        aria-describedby="create-bill-description"
      >
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
          <DialogDescription id="create-bill-description">
            Search products, add items, and enter buyer details (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>
                  Search and add items from products.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    placeholder="Search products by name, SKU, or category..."
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
                      {productsLoading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No products found</div>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product._id}
                            className={`px-4 py-2 border-b last:border-b-0 flex justify-between items-center
                              ${product.quantity === 0 ? 'text-red-500 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}`}
                            onMouseDown={() => {
                              if (product.quantity === 0) return;
                              addItemToBill({
                                productId: product._id,
                                sku: product.SKU,
                                itemName: product.productName,
                                categoryName: product.categoryName,
                                subCategory: product.subCategory,
                                price: product.sellingPrice,
                                availableQty: product.quantity,
                              });
                              setShowSearchResults(false);
                              setSearchProduct('');
                            }}
                          >
                            <div>
                              <p className="text-sm font-medium">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.categoryName}
                                {product.subCategory ? ` - ${product.subCategory}` : ''} · SKU: {product.SKU} ·{' '}
                                {currencySymbol}
                                {Number(product.sellingPrice).toFixed(2)} · {product.quantity} in stock
                              </p>
                            </div>
                            {isProductSelected(product._id) && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
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
                        <TableRow key={index}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.categoryName}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={1}
                              max={item.availableQty}
                              value={item.qty}
                              onChange={(e) =>
                                updateQty(index, Number(e.target.value))
                              }
                              className="w-16 text-right"
                              aria-label={`Quantity for ${item.itemName}`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}
                            {Number(item.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}
                            {Number(item.lineTotal).toFixed(2)}
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
                <CardDescription>Enter buyer and payment details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    onChange={(e) =>
                      setBuyer({ ...buyer, name: e.target.value })
                    }
                    required={buyerDetailsRequired}
                    aria-label="Buyer name"
                  />
                  
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="buyer-email"
                  >
                    Buyer Email{' '}
                    
                  </label>
                  <Input
                    id="buyer-email"
                    placeholder="john.doe@example.com"
                    value={buyer.email || ''}
                    onChange={(e) =>
                      setBuyer({ ...buyer, email: e.target.value })
                    }
                    required={buyerDetailsRequired}
                    type="email"
                    aria-label="Buyer email"
                  />
                  
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="buyer-phone"
                  >
                    Buyer Phone{' '}
                  </label>
                  <Input
                    id="buyer-phone"
                    placeholder="+1234567890"
                    value={buyer.phone || ''}
                    onChange={(e) =>
                      setBuyer({ ...buyer, phone: e.target.value })
                    }
                    required={buyerDetailsRequired}
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
                      required={buyerDetailsRequired}
                      aria-label={
                        paymentMethod === PAYMENT_METHODS.CREDIT_CARD
                          ? 'Card number'
                          : 'Bank account number'
                      }
                    />
                    {!paymentNumber?.trim() && buyerDetailsRequired && (
                      <p className="text-xs text-red-500">
                        {paymentMethod === PAYMENT_METHODS.CREDIT_CARD
                          ? 'Card number is required'
                          : 'Bank account number is required'}
                      </p>
                    )}
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
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              aria-label="Cancel bill creation"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (
                  window.confirm('Are you sure you want to reset all fields?')
                ) {
                  onReset();
                }
              }}
              aria-label="Reset form"
            >
              Reset Form
            </Button>
            <Button
              variant="header"
              onClick={() => {
                if (!items.length) {
                  alert('Please add at least one item.');
                  return;
                }
                onSave?.(draftBill);
                onPrintReceipt?.(draftBill);
              }}
              disabled={items.length === 0}
              aria-label="Print receipt"
            >
              <Printer className="w-4 h-4 mr-2" />
              Save & Print Receipt
            </Button>
            <div className="relative">
              <Button
                onClick={handleSave}
                disabled={creating || items.length === 0}
                aria-label="Save bill"
              >
                {creating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                <CreditCard className="w-4 h-4 mr-2" />
                Save Bill
              </Button>
              {items.length === 0 && (
                <p className="text-sm text-red-500 mt-2 absolute">Please add at least one item.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}