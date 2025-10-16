'use client';

import { useMemo, useRef, useEffect } from 'react';
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
  Package,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useClickOutside } from '@/utils/useClickOutside';
import { useDebounce } from '@/utils/useDebounce';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';

CreateBillDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  creating: PropTypes.bool.isRequired,
  searchRef: PropTypes.shape({ current: PropTypes.any }),
  searchInventory: PropTypes.string.isRequired,
  setSearchInventory: PropTypes.func.isRequired,
  showSearchResults: PropTypes.bool.isRequired,
  setShowSearchResults: PropTypes.func.isRequired,
  inventoryLoading: PropTypes.bool.isRequired,
  searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
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
  onPrintReceipt: PropTypes.func,
  companyId: PropTypes.string,
  taxRates: PropTypes.shape({
    taxRateCash: PropTypes.number,
    taxRateCard: PropTypes.number,
  }),
  companyLoading: PropTypes.bool,
};

export function CreateBillDialog({
  open,
  onOpenChange,
  creating,
  searchRef,
  searchInventory,
  setSearchInventory,
  showSearchResults,
  setShowSearchResults,
  inventoryLoading,
  searchResults,
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
  onPrintReceipt,
  companyId,
  taxRates,
  companyLoading,
  currencySymbol,

}) {
  const debouncedSearchInventory = useDebounce(searchInventory, 300);
  useClickOutside(searchRef, () => setShowSearchResults(false));

  // Set default payment method to CASH on mount
  useEffect(() => {
    setPaymentMethod(PAYMENT_METHODS.CASH);
  }, []); // Empty dependency array to run only once on mount

  // Update tax rate based on payment method
  useEffect(() => {
    if (taxRates) {
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
    }
  }, [paymentMethod, taxRates, setTaxPercent]);

  const isTaxRateSet = useMemo(() => {
    return taxRates?.taxRateCash > 0 && taxRates?.taxRateCard > 0;
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
      items: items.map((it) => ({
        sku: it.sku,
        itemName: it.itemName,
        variantName: it.variantName,
        quantity: it.qty,
        price: it.price,
        lineTotal: it.lineTotal,
      })),
      subtotal,
      taxPercent: Number(taxPercent || 0),
      taxAmount,
      total: grandTotal,
      paymentMethod,
      paymentNumber,
      status: 'pending',
    }),
    [
      buyer,
      items,
      subtotal,
      taxPercent,
      taxAmount,
      grandTotal,
      paymentMethod,
      paymentNumber,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="min-w-[70rem] max-h-[90vh] overflow-y-auto"
        aria-describedby="create-bill-description"
      >
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
          <DialogDescription id="create-bill-description">
            Search inventory, add items, and enter buyer details (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Add Products
                </CardTitle>
                <CardDescription>
                  Search and add products to the bill
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, SKU, type…"
                    value={searchInventory}
                    onChange={(e) => {
                      setSearchInventory(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className="pl-10 bg-input border-border"
                    aria-label="Search inventory"
                  />

                  {showSearchResults && debouncedSearchInventory.trim() && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {inventoryLoading ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Loader className="w-4 h-4 animate-spin inline mr-2" />
                          Searching…
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No products found
                        </div>
                      ) : (
                        searchResults.map((item, idx) => (
                          <button
                            key={item.sku || idx}
                            className="w-full p-3 text-left hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                            onClick={() => {
                              addItemToBill(item);
                              setShowSearchResults(false);
                            }}
                            aria-label={`Add ${item.productName} to bill`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-foreground">
                                  {item.productName}
                                  {item.variantName && ` - ${item.variantName}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {item.sku && `SKU: ${item.sku} • `}
                                  {item.productType &&
                                    `Type: ${item.productType}`}
                                </div>
                                {item.quantity !== undefined && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Stock: {item.quantity}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-foreground">
                                  {currencySymbol}
                                  {Number(item.price || 0).toFixed(2)}
                                </div>
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs"
                                >
                                  {item.type === 'variant'
                                    ? 'Variant'
                                    : 'Product'}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {items.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-muted/50">
                          <TableHead scope="col">Product</TableHead>
                          <TableHead scope="col" className="text-right">
                            Price
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Qty
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Total
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow
                            key={item.variantId}
                            className="border-border hover:bg-muted/50"
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium text-card-foreground">
                                  {item.itemName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.variantName} • {item.sku}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Stock: {item.availableQty}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-card-foreground">
                              {currencySymbol}
                              {Number(item.price).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="1"
                                max={item.availableQty}
                                value={item.qty}
                                onChange={(e) =>
                                  updateQty(
                                    item.variantId,
                                    Math.min(
                                      Number(e.target.value),
                                      item.availableQty
                                    )
                                  )
                                }
                                className="w-20 ml-auto text-right"
                                aria-label={`Quantity for ${item.itemName}`}
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {currencySymbol}
                              {Number(item.lineTotal).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.variantId)}
                                aria-label={`Remove ${item.itemName} from bill`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No items added yet</p>
                    <p className="text-sm">Search above to add items</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Buyer & Summary
                </CardTitle>
                <CardDescription>
                  Customer details and order summary
                  {/* {buyerDetailsRequired && (
                    <span className="text-red-500">
                      {" "}
                      (Required for{" "}
                      {paymentMethod === PAYMENT_METHODS.CREDIT_CARD
                        ? "Credit Card"
                        : "Bank Transfer"}
                      )
                    </span>
                  )} */}
                </CardDescription>
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
                    placeholder="Enter buyer name"
                    value={buyer.name || ''}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, name: e.target.value }))
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
                    Email{' '}
                    {buyerDetailsRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <Input
                    id="buyer-email"
                    placeholder="buyer@email.com"
                    value={buyer.email || ''}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, email: e.target.value }))
                    }
                    required={buyerDetailsRequired}
                    aria-label="Buyer email"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="buyer-phone"
                  >
                    Phone{' '}
                    {buyerDetailsRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <Input
                    id="buyer-phone"
                    placeholder="+92 3XX XXXXXXX"
                    value={buyer.phone || ''}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, phone: e.target.value }))
                    }
                    required={buyerDetailsRequired}
                    aria-label="Buyer phone"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="tax-percent"
                  >
                    Tax (%)
                  </label>
                  {companyLoading ? (
                    <div className="text-sm text-muted-foreground">
                      <Loader className="w-4 h-4 animate-spin inline mr-2" />
                      Loading tax settings…
                    </div>
                  ) : isTaxRateSet ? (
                    <Input
                      id="tax-percent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxPercent}
                      disabled
                      aria-label="Tax percentage (set in company settings)"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id="tax-percent"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Tax not set"
                        value={taxPercent}
                        disabled
                        aria-label="Tax percentage (not set)"
                      />
                    </div>
                  )}
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
                    className="w-full border rounded px-3 py-2 bg-background"
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
                      {' '}
                      {currencySymbol}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({taxPercent || 0}%):
                    </span>
                    <span className="font-medium">
                      {' '}
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
                onSave?.();
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
                onClick={onSave}
                disabled={creating || items.length === 0}
                aria-label="Save bill"
              >
                {creating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                <CreditCard className="w-4 h-4 mr-2" />
                Save Bill
              </Button>
              {/* {(items.length === 0 || !isBuyerDetailsValid) && (
                <p className="text-sm text-red-500 mt-2 absolute">
                  {items.length === 0
                    ? "Please add at least one item."
                    : "Please fill in all required buyer details and payment number."}
                </p>
              )} */}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
