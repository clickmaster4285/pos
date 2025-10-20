'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import PropTypes from 'prop-types';

ThermalPrintSlip.propTypes = {
  bill: PropTypes.shape({
    _id: PropTypes.string,
    billNumber: PropTypes.string,
    createdAt: PropTypes.string,
    buyer: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        quantity: PropTypes.number,
        itemName: PropTypes.string,
        categoryName: PropTypes.string,
        subCategory: PropTypes.string,
        sku: PropTypes.string,
        price: PropTypes.number,
        total: PropTypes.number,
      })
    ),
    subtotal: PropTypes.number,
    taxPercent: PropTypes.number,
    taxAmount: PropTypes.number,
    total: PropTypes.number,
    paymentMethod: PropTypes.string,
    paymentNumber: PropTypes.string,
  }).isRequired,
  currencySymbol: PropTypes.string,
};

export function ThermalPrintSlip({ bill, currencySymbol = '€' }) {
  const formattedContent = useMemo(() => {
    const lines = [
      '==============================',
      `Bill #${bill.billNumber}`,
      `Date: ${new Date(bill.createdAt).toLocaleString()}`,
      '==============================',
      'Items:',
    ];
    bill.items.forEach((item) => {
      lines.push(`${item.quantity}x ${item.itemName}`);
      lines.push(`  ${item.categoryName}${item.subCategory ? ` - ${item.subCategory}` : ''}`);
      lines.push(`  SKU: ${item.sku}`);
      lines.push(`  ${currencySymbol}${Number(item.price || 0).toFixed(2)} x ${item.quantity} = ${currencySymbol}${Number(item.total || 0).toFixed(2)}`);
    });
    lines.push('==============================');
    lines.push(`Subtotal: ${currencySymbol}${Number(bill.subtotal || 0).toFixed(2)}`);
    lines.push(`Tax (${bill.taxPercent}%): ${currencySymbol}${Number(bill.taxAmount || 0).toFixed(2)}`);
    lines.push(`Total: ${currencySymbol}${Number(bill.total || 0).toFixed(2)}`);
    lines.push('==============================');
    lines.push('Buyer:');
    lines.push(`  Name: ${bill.buyer?.name || '—'}`);
    lines.push(`  Email: ${bill.buyer?.email || '—'}`);
    lines.push(`  Phone: ${bill.buyer?.phone || '—'}`);
    lines.push(`Payment: ${bill.paymentMethod.replace('_', ' ')}`);
    if (bill.paymentNumber) {
      lines.push(`  Ref: ${bill.paymentNumber}`);
    }
    lines.push('==============================');
    lines.push('Thank you for your purchase!');
    return lines.join('\n');
  }, [bill, currencySymbol]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <pre style="font-family: monospace; font-size: 12px; line-height: 1.2;">
${formattedContent}
      </pre>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Button onClick={handlePrint} variant="outline" className="gap-2">
      <Printer className="w-4 h-4" />
      Print Slip
    </Button>
  );
}