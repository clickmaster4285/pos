'use client';

import { useState } from 'react';
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
import { Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import PropTypes from 'prop-types';

BillingTableDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  bills: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      billNumber: PropTypes.string,
      buyer: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
      }),
      items: PropTypes.arrayOf(
        PropTypes.shape({
          itemName: PropTypes.string,
          categoryName: PropTypes.string,
          subCategory: PropTypes.string,
          sku: PropTypes.string,
          quantity: PropTypes.number,
          price: PropTypes.number,
        })
      ),
      total: PropTypes.number,
      status: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ).isRequired,
  onSelectBill: PropTypes.func.isRequired,
  currencySymbol: PropTypes.string.isRequired,
};

export function BillingTableDialog({ open, onOpenChange, bills, onSelectBill, currencySymbol = '€' }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBills = bills.filter(
    (b) =>
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.buyer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'refunded':
      case 'partially_refunded':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Bills Overview</DialogTitle>
          <DialogDescription>
            View and select bills to manage or review details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-card" />
            <Input
              placeholder="Search bills by number, buyer, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow
                    key={bill._id}
                    onClick={() => onSelectBill(bill)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>{bill.billNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bill.buyer?.name || '—'}</div>
                        <div className="text-sm text-muted-foreground">
                          {bill.buyer?.email || '—'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(bill.items || []).slice(0, 2).map((item, i) => (
                        <div key={i} className="text-sm">
                          {item.quantity}x {item.itemName} ({item.categoryName})
                        </div>
                      ))}
                      {bill.items?.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{bill.items.length - 2} more
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {currencySymbol}{Number(bill.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bill.status)}
                        <span className="capitalize">{bill.status.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}