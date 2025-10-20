'use client';
import { useState, useEffect,useMemo } from 'react';

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
import { Loader, AlertCircle } from 'lucide-react';
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

  const billItems = useMemo(() => {
    if (!bill?.items) return [];
    return bill.items.map((item) => ({
      ...item,
      availableToRefund: item.quantity - (item.refundHistory?.reduce((sum, r) => sum + (r.refundQuantity || 0), 0) || 0),
    }));
  }, [bill]);

  useEffect(() => {
    if (bill && refundType === 'full') {
      setRefundItems(
        billItems.map((item) => ({
          productId: item.productId,
          quantity: item.availableToRefund,
        }))
      );
    } else {
      setRefundItems(
        billItems.map((item) => ({
          productId: item.productId,
          quantity: 0,
        }))
      );
    }
  }, [bill, billItems, refundType]);

  const totalRefundAmount = useMemo(() => {
    return refundItems.reduce((sum, refundItem) => {
      const billItem = billItems.find((i) => i.productId === refundItem.productId);
      if (!billItem) return sum;
      return sum + refundItem.quantity * (billItem.price || 0);
    }, 0);
  }, [refundItems, billItems]);

  const handleQuantityChange = (productId, value) => {
    const billItem = billItems.find((i) => i.productId === productId);
    if (!billItem) return;
    const maxRefundable = billItem.availableToRefund;
    const quantity = Math.max(0, Math.min(Number(value) || 0, maxRefundable));
    setRefundItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRefund = () => {
    if (refundType === 'partial' && !refundItems.some((item) => item.quantity > 0)) {

      return;
    }
    if (!refundReason.trim()) {

      return;
    }
    onRefund(bill, {
      refundType,
      items: refundItems.filter((item) => item.quantity > 0),
      refundReason,
      totalRefundAmount,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {refundType === 'full' ? 'Full Refund' : 'Partial Refund'} - Bill #{bill?.billNumber}
          </DialogTitle>
          <DialogDescription>
            {refundType === 'full'
              ? 'Process a full refund for all items in the bill.'
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
                  billItems.map((item) => (
                    <TableRow key={item.productId}>
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
                          value={
                            refundItems.find((ri) => ri.productId === item.productId)?.quantity || 0
                          }
                          onChange={(e) =>
                            handleQuantityChange(item.productId, e.target.value)
                          }
                          className="w-16 text-right"
                          disabled={item.availableToRefund === 0}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {currencySymbol}
                        {(refundItems.find((ri) => ri.productId === item.productId)?.quantity * (item.price || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
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
              {currencySymbol}{totalRefundAmount.toFixed(2)}
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
              (refundType === 'partial' && !refundItems.some((item) => item.quantity > 0))
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