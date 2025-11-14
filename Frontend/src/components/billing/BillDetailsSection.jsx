import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PropTypes from 'prop-types';
import { PAYMENT_METHODS } from '@/utils/paymentMethods';

function BillDetailsSection({
  buyer,
  setBuyer,
  buyerTouched,
  setBuyerTouched,
  paymentMethod,
  setPaymentMethod,
  paymentNumber,
  setPaymentNumber,
  buyerDetailsRequired,
  notes,
  setNotes,
  subtotal,
  taxPercent,
  taxAmount,
  grandTotal,
  currencySymbol,
  discountPercent,
  discountAmount,
  setDiscountPercent,
}) {
  return (
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
            {buyerDetailsRequired && <span className="text-red-500">*</span>}
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
            onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
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
              if (e.target.value === PAYMENT_METHODS.CASH && setPaymentNumber) {
                setPaymentNumber('');
              }
            }}
            aria-label="Payment method"
          >
            <option value={PAYMENT_METHODS.CASH}>Cash</option>
            <option value={PAYMENT_METHODS.CREDIT_CARD}>Credit Card</option>
            <option value={PAYMENT_METHODS.BANK_TRANSFER}>Bank Transfer</option>
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
        {/* Discount (%) */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="discount-percent"
          >
            Discount (%)
          </label>
          <input
            id="discount-percent"
            type="number"
            min="0"
            max="100"
            className="w-full border rounded px-3 py-2 bg-background text-foreground text-sm"
            value={discountPercent ?? 0}
            onChange={(e) => {
              const value = Number(e.target.value || 0);
              if (!setDiscountPercent) return;
              // clamp between 0–100
              setDiscountPercent(Math.max(0, Math.min(100, value)));
            }}
            placeholder="0"
            aria-label="Discount percentage"
          />
          {discountAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Discount amount: {currencySymbol}
              {discountAmount.toFixed(2)}
            </p>
          )}
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">
              {currencySymbol}
              {subtotal.toFixed(2)}
            </span>
          </div>

          {/* NEW: Discount row */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount:</span>
            <span className="font-medium">
              -{currencySymbol}
              {discountAmount.toFixed(2)}
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
  );
}

BillDetailsSection.propTypes = {
  buyer: PropTypes.object.isRequired,
  setBuyer: PropTypes.func.isRequired,
  buyerTouched: PropTypes.bool.isRequired,
  setBuyerTouched: PropTypes.func.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  setPaymentMethod: PropTypes.func.isRequired,
  paymentNumber: PropTypes.string,
  setPaymentNumber: PropTypes.func,
  buyerDetailsRequired: PropTypes.bool.isRequired,
  notes: PropTypes.string.isRequired,
  setNotes: PropTypes.func.isRequired,
  subtotal: PropTypes.number.isRequired,
  taxPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  taxAmount: PropTypes.number.isRequired,
  grandTotal: PropTypes.number.isRequired,
  currencySymbol: PropTypes.string,
  discountPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  discountAmount: PropTypes.number,
  setDiscountPercent: PropTypes.func,
};

export default BillDetailsSection;
