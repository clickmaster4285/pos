'use client';
import { useState, useEffect, useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader } from 'lucide-react';
import PropTypes from 'prop-types';

RefundDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  bill: PropTypes.shape({
    _id: PropTypes.string,
    billNumber: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        productId: PropTypes.string,
        ProductId: PropTypes.string, // allow capitalized variant
        orderItemId: PropTypes.string, // include order item id
        OrderItemId: PropTypes.string, // capitalized variant
        sku: PropTypes.string,
        itemName: PropTypes.string,
        categoryName: PropTypes.string,
        subCategory: PropTypes.string,
        quantity: PropTypes.number,
        price: PropTypes.number,
        total: PropTypes.number,
        refundHistory: PropTypes.arrayOf(
          PropTypes.shape({
            refundQuantity: PropTypes.number,
            refundAmount: PropTypes.number,
            refundedAt: PropTypes.string,
          })
        ),
      })
    ),
    subtotal: PropTypes.number,
    taxPercent: PropTypes.number,
    taxAmount: PropTypes.number,
    total: PropTypes.number,
  }),
  onRefund: PropTypes.func.isRequired,
  refunding: PropTypes.bool.isRequired,
  refundType: PropTypes.oneOf(['partial', 'full']).isRequired,
  currencySymbol: PropTypes.string,
};

export function RefundDialog({
  open,
  onOpenChange,
  bill,
  onRefund,
  refunding,
  refundType,
  currencySymbol = '€',
}) {
  const [refundItems, setRefundItems] = useState([]);
  const [refundReason, setRefundReason] = useState('');

  // Build a normalized list of bill items with availableToRefund and both ID casings
  const billItems = useMemo(() => {
    if (!bill?.items) return [];
    return bill.items.map((item) => {
      const already =
        item.refundHistory?.reduce((s, r) => s + (r.refundQuantity || 0), 0) ||
        0;
      const availableToRefund = Math.max(0, (item.quantity || 0) - already);
      return {
        ...item,
        productIdNorm: String(item.productId || item.ProductId || ''), // normalized product id
        orderItemIdNorm: String(item.orderItemId || item.OrderItemId || ''), // normalized order item id
        availableToRefund,
      };
    });
  }, [bill]);

  // Initialize selection depending on partial/full
  useEffect(() => {
    if (!billItems.length) {
      setRefundItems([]);
      return;
    }
    if (refundType === 'full') {
      setRefundItems(
        billItems.map((it) => ({
          productId: it.productIdNorm || undefined,
          orderItemId: it.orderItemIdNorm || undefined,
          quantity: it.availableToRefund,
        }))
      );
    } else {
      setRefundItems(
        billItems.map((it) => ({
          productId: it.productIdNorm || undefined,
          orderItemId: it.orderItemIdNorm || undefined,
          quantity: 0,
        }))
      );
    }
  }, [billItems, refundType]);

  // Compute total based on current selections
  const totalRefundAmount = useMemo(() => {
    return refundItems.reduce((sum, ri) => {
      const found = billItems.find(
        (i) =>
          (ri.productId && i.productIdNorm === ri.productId) ||
          (ri.orderItemId && i.orderItemIdNorm === ri.orderItemId)
      );
      if (!found) return sum;
      return sum + (Number(ri.quantity) || 0) * (Number(found.price) || 0);
    }, 0);
  }, [refundItems, billItems]);

  // Change qty by productId/orderItemId
  const handleQuantityChange = (keyObj, value) => {
    const quantityRaw = Number(value);
    const quantity = Number.isFinite(quantityRaw) ? quantityRaw : 0;

    setRefundItems((prev) =>
      prev.map((ri) => {
        const same =
          (keyObj.productId && ri.productId === keyObj.productId) ||
          (keyObj.orderItemId && ri.orderItemId === keyObj.orderItemId);
        if (!same) return ri;

        const item = billItems.find(
          (i) =>
            (ri.productId && i.productIdNorm === ri.productId) ||
            (ri.orderItemId && i.orderItemIdNorm === ri.orderItemId)
        );
        const maxRefundable = item?.availableToRefund ?? 0;
        const clamped = Math.max(0, Math.min(quantity, maxRefundable));
        return { ...ri, quantity: clamped };
      })
    );
  };

  // Submit: emit exactly what BillingPage expects ({ notes, lines })
  const handleRefund = () => {
    if (
      refundType === 'partial' &&
      !refundItems.some((x) => Number(x.quantity) > 0)
    ) {
      // nothing selected
      return;
    }
    if (!refundReason.trim()) {
      return;
    }

    // Build lines exactly as the backend expects (BillingPage will map -> refundItems)
    const lines = refundItems
      .filter((x) => Number(x.quantity) > 0 && (x.productId || x.orderItemId))
      .map((x) => ({
        productId: x.productId, // string | undefined
        orderItemId: x.orderItemId, // string | undefined
        quantity: Number(x.quantity),
        reason: refundReason.trim(),
      }));

    onRefund(bill, {
      notes: refundReason.trim(),
      lines, // BillingPage.buildRefundPayload -> { notes, refundItems }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {refundType === 'full' ? 'Full Refund' : 'Partial Refund'} — Bill #
            {bill?.billNumber}
          </DialogTitle>
          <DialogDescription>
            {refundType === 'full'
              ? 'Process a full refund for all refundable items.'
              : 'Select items and quantities to refund.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {refundType === 'partial' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Refund Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No items available for refund
                    </TableCell>
                  </TableRow>
                ) : (
                  billItems.map((item) => {
                    const key = {
                      productId: item.productIdNorm,
                      orderItemId: item.orderItemIdNorm,
                    };
                    const selected = refundItems.find(
                      (ri) =>
                        (ri.productId && ri.productId === key.productId) ||
                        (ri.orderItemId && ri.orderItemId === key.orderItemId)
                    );
                    const qty = selected?.quantity || 0;
                    const amount = (qty * (item.price || 0)).toFixed(2);

                    return (
                      <TableRow
                        key={`${item.productIdNorm}-${item.orderItemIdNorm}`}
                      >
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell className="text-right">
                          {item.availableToRefund}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={item.availableToRefund}
                            value={qty}
                            onChange={(e) =>
                              handleQuantityChange(key, e.target.value)
                            }
                            className="w-16 text-right"
                            disabled={item.availableToRefund === 0}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {currencySymbol}
                          {item.price.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="refund-reason"
            >
              Refund Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="refund-reason"
              placeholder="Enter reason for refund"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="min-h-[100px]"
            />
            {!refundReason.trim() && (
              <p className="text-xs text-red-500">Refund reason is required</p>
            )}
          </div>

          <div className="flex justify-between text-sm font-medium">
            <span>Total Refund Amount</span>
            <span>
              {currencySymbol}
              {totalRefundAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={refunding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRefund}
            disabled={
              refunding ||
              !refundReason.trim() ||
              (refundType === 'partial' &&
                !refundItems.some((x) => Number(x.quantity) > 0))
            }
          >
            {refunding ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Refund'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
