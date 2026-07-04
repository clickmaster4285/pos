'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSelector } from 'react-redux';
import { useGetCompanyQuery } from '@/features/CompanyApi';
const num = (v) => Number(v || 0);

const getRefundedAmount = (bill = {}) => {
  const topLevel =
    num(bill.totalRefundAmount) || num(bill?.refundDetails?.totalRefundAmount);

  if (topLevel) return topLevel;

  const items = Array.isArray(bill.items) ? bill.items : [];
  return items.reduce((sum, item) => {
    if (item && item.refundAmount != null) return sum + num(item.refundAmount);
    const hist = Array.isArray(item?.refundHistory) ? item.refundHistory : [];
    const histSum = hist.reduce((s, r) => s + num(r.refundAmount), 0);
    return sum + histSum;
  }, 0);
};

function StatusBadge({ status }) {
  const map = {
    paid: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    partially_refunded: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    refunded: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    pending: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.color} capitalize`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}

export function BillRow({
  bill,
  expanded,
  onToggleExpand,
  onEdit,
  onPrint,
  onPrintThermal,
  onDelete,
  onView,
  updatePermission,
  deletePermission,
  currencySymbol = '€',
}) {
  const refundedAmount = useMemo(() => getRefundedAmount(bill), [bill]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFillColor(59, 130, 246); // Blue background similar to AttendanceHeader
      doc.rect(0, 0, 220, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(`Bill #${bill.billNumber}`, 14, 25);

      // Subheader
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(bill.createdAt).toLocaleString()}`, 14, 35);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 42);

      // Table
      const tableColumn = [
        'Item',
        'Category',
        'Subcategory',
        'SKU',
        'Qty',
        'Price',
        'Total',
      ];
      const tableRows = bill.items.map((item) => [
        item.itemName,
        item.categoryName,
        item.subCategory || '—',
        item.sku,
        item.quantity.toString(),
        `${currencySymbol}${num(item.price).toFixed(2)}`,
        `${currencySymbol}${num(item.total).toFixed(2)}`,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59], // Dark slate background
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // Light gray for alternate rows
        margin: { left: 14, right: 14 },
      });

      // Summary
      const finalY = doc.lastAutoTable.finalY || 50;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(
        `Subtotal: ${currencySymbol}${num(bill.subtotal).toFixed(2)}`,
        14,
        finalY + 10
      );
      doc.text(
        `Tax (${bill.taxPercent}%): ${currencySymbol}${num(
          bill.taxAmount
        ).toFixed(2)}`,
        14,
        finalY + 20
      );
      doc.text(
        `Total: ${currencySymbol}${num(bill.total).toFixed(2)}`,
        14,
        finalY + 30
      );
      doc.text(
        `Refunded: ${currencySymbol}${num(refundedAmount).toFixed(2)}`,
        14,
        finalY + 40
      );
      doc.text(
        `Net Total: ${currencySymbol}${num(bill.total).toFixed(2)}`,
        14,
        finalY + 50
      );

      // Buyer Details
      doc.text('Buyer:', 14, finalY + 60);
      doc.text(`Name: ${bill.buyer?.name || '—'}`, 14, finalY + 70);
      doc.text(`Email: ${bill.buyer?.email || '—'}`, 14, finalY + 80);
      doc.text(`Phone: ${bill.buyer?.phone || '—'}`, 14, finalY + 90);
      doc.text(
        `Payment: ${bill.paymentMethod.replace('_', ' ')}`,
        14,
        finalY + 100
      );
      if (bill.paymentNumber) {
        doc.text(`Ref: ${bill.paymentNumber}`, 14, finalY + 110);
      }

      doc.save(`bill_${bill.billNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    }
  };
  const user = useSelector((state) => state.auth.user);

  const { data: companyRes, isLoading, isError } = useGetCompanyQuery();
  const companyName = companyRes?.data.name || null;

  const handleThermalPrint = () => {
    const companyName = companyRes?.data.name || null;

    const formattedContent = [
      '==============================',
      `Bill #${bill.billNumber}`,
      `Date: ${new Date(bill.createdAt).toLocaleString()}`,
      '==============================',
      'Buyer:',
      `  Name: ${bill.buyer?.name || '—'}`,
      `  Phone: ${bill.buyer?.phone || '—'}`,
      '==============================',
      'Items:',
      ...bill.items.flatMap((item) => [
        `${item.quantity}x ${item.itemName}`,
        `  ${currencySymbol}${num(item.price).toFixed(2)} x ${
          item.quantity
        } = ${currencySymbol}${num(item.total).toFixed(2)}`,
      ]),
      `Payment: ${bill.paymentMethod.replace('_', ' ')}`,
      ...(bill.paymentNumber ? [`  Ref: ${bill.paymentNumber}`] : []),
      '==============================',
      `Subtotal: ${currencySymbol}${num(bill.subtotal).toFixed(2)}`,
      `Discount: ${currencySymbol}${num(bill.discountAmount).toFixed(2)}`,
      `Tax (${bill.taxPercent}%): ${currencySymbol}${num(
        bill.taxAmount
      ).toFixed(2)}`,
      `Total: ${currencySymbol}${num(bill.total).toFixed(2)}`,
      '==============================',
      'Thank you for your purchase!',
    ].join('\n');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <div style="font-family: monospace; line-height: 1.2;">
      <div style="font-weight: 900; font-size: 16px; margin-top: 6px;">
        ${companyName.toUpperCase()}
      </div>
      <pre style="font-size: 12px;">
${formattedContent}
      </pre>
    </div>
  `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <TableRow className="border-border hover:bg-muted/50">
        <TableCell
          className="font-medium text-card-foreground"
          onClick={() => onView(bill)}
        >
          {bill.billNumber}
        </TableCell>

        <TableCell onClick={() => onView(bill)}>
          <div className="flex flex-col">
            <span className="font-medium text-card-foreground">
              {bill?.buyer?.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {bill?.buyer?.email}
            </span>
          </div>
        </TableCell>

        <TableCell onClick={() => onView(bill)}>
          <div className="flex flex-col gap-1">
            {(bill.items || []).slice(0, 2).map((item, i) => (
              <div key={i} className="text-sm text-card-foreground">
                {item.quantity}x {item.itemName} ({item.categoryName})
              </div>
            ))}
            {(bill.items || []).length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{(bill.items || []).length - 2} more items
              </div>
            )}
          </div>
        </TableCell>

        <TableCell
          className="text-right font-semibold text-card-foreground"
          onClick={() => onView(bill)}
        >
          {currencySymbol}
          {bill.total.toFixed(2)}
        </TableCell>

        <TableCell onClick={() => onView(bill)}>
          <StatusBadge status={bill.status} />
        </TableCell>

        <TableCell className="text-sm text-muted-foreground">
          {new Date(bill.createdAt).toLocaleDateString()}
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="h-8 w-8"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="bg-popover border-border"
              >
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-popover-foreground hover:bg-accent">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Refund
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    <DropdownMenuItem
                      onClick={() => onEdit(bill, 'partial')}
                      disabled={!updatePermission || bill.status === 'refunded'}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      Partial Refund
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!updatePermission || bill.status === 'refunded'}
                      onClick={() => onEdit(bill, 'full')}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      Full Refund
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-popover-foreground hover:bg-accent">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    <DropdownMenuItem
                      onClick={handleThermalPrint}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Thermal Print
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDownloadPDF}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  disabled={!deletePermission}
                  className="text-red-600 hover:bg-accent hover:text-red-700"
                  onClick={() => onDelete(bill._id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-card-foreground mb-3">
                  Bill Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {num(bill.subtotal).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax ({bill.taxPercent}%):
                    </span>
                    <span className="font-medium">
                      {currencySymbol}
                      {num(bill.taxAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {num(bill.total).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refunded:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {num(refundedAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground font-medium">
                      Net Total:
                    </span>
                    <span className="font-bold text-lg">
                      {currencySymbol}
                      {num(bill.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {bill.notes && (
                  <div className="mt-4">
                    <h5 className="font-medium text-card-foreground mb-1">
                      Notes
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {bill.notes}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-card-foreground mb-3">
                  Items
                </h4>
                <div className="space-y-2">
                  {(bill.items || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 bg-background rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.categoryName}{' '}
                          {item.subCategory ? `· ${item.subCategory}` : ''} ·{' '}
                          {item.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {item.quantity} × {currencySymbol}
                          {num(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
