'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGetBillsQuery } from '@/features/billingApi';
import { useGetCompanyQuery } from '@/features/CompanyApi';

export default function BillingSummaryPDF() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const {
    data: bills = [],
    isLoading: billsLoading,
    error: billsError,
  } = useGetBillsQuery();
  const {
    data: companyData,
    isLoading: companyLoading,
    error: companyError,
  } = useGetCompanyQuery();

  const currentDate = new Date().toISOString().split('T')[0];

  const filteredBills = useMemo(() => {
    if (!startDate || billsLoading || billsError) return [];

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    let end = start;
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (end < start) {
        end = start;
        setEndDate(startDate);
      }
    }

    return bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= start && billDate <= end;
    });
  }, [bills, startDate, endDate, billsLoading, billsError]);

  const summary = useMemo(() => {
    if (billsLoading || billsError || !filteredBills)
      return { total: 0, paid: 0, refunded: 0, totalRevenue: 0 };
    const total = filteredBills.length;
    const paid = filteredBills.filter((bill) => bill.status === 'paid').length;
    const refunded = filteredBills.filter(
      (bill) =>
        bill.status === 'refunded' || bill.status === 'partially_refunded'
    ).length;
    const totalRevenue = filteredBills
      .filter((bill) => bill.status === 'paid')
      .reduce((sum, bill) => sum + Number(bill.total || 0), 0);

    return { total, paid, refunded, totalRevenue };
  }, [filteredBills, billsLoading, billsError]);

  const generatePDF = () => {
    if (
      billsLoading ||
      companyLoading ||
      !startDate ||
      billsError ||
      companyError
    )
      return;

    const doc = new jsPDF();
    const companyName = companyData?.data?.name || 'Your Company';
    const generatedDate = new Date().toLocaleString('en-PK', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    try {
      // Card-like Header
      doc.setFillColor(240, 240, 240); // Light gray background for card effect
      doc.roundedRect(14, 10, 182, 30, 3, 3, 'F'); // Card background
      doc.setLineWidth(0.5);
      doc.setDrawColor(150, 150, 150); // Border color
      doc.roundedRect(14, 10, 182, 30, 3, 3); // Card border

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${companyName} - Billing Summary`, 105, 22, {
        align: 'center',
      });

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const dateText = endDate ? `${startDate} to ${endDate}` : startDate;
      doc.text(`Date Range: ${dateText}`, 105, 30, { align: 'center' });

      // Card-like Summary (single row)
      doc.setFillColor(240, 240, 240); // Light gray background for card effect
      doc.roundedRect(14, 45, 182, 15, 3, 3, 'F'); // Card background
      doc.setLineWidth(0.5);
      doc.setDrawColor(150, 150, 150); // Border color
      doc.roundedRect(14, 45, 182, 15, 3, 3); // Card border

      doc.setFontSize(10);
      doc.setTextColor(20);
      const summaryText = `Total Bills: ${summary.total} | Paid Bills: ${
        summary.paid
      } | Refunded Bills: ${
        summary.refunded
      } | Total Revenue: ${summary.totalRevenue.toFixed(2)}`;
      doc.text(summaryText, 16, 53, { align: 'left' });

      // Detailed Bills Table (classic style)
      if (filteredBills.length > 0) {
        autoTable(doc, {
          startY: 65,
          head: [['Bill Number', 'Date', 'Buyer', 'Items', 'Total', 'Status']],
          body: filteredBills.map((bill) => [
            bill.billNumber,
            new Date(bill.createdAt).toLocaleDateString(),
            bill.buyer?.name || 'N/A',
            bill.items
              .map(
                (item) =>
                  `${item.quantity}x ${item.itemName} (${item.variantName})`
              )
              .join(', '),
            `${Number(bill.total || 0).toFixed(2)}`, // Removed currency symbol
            bill.status,
          ]),
          theme: 'grid', // Classic grid style
          styles: {
            halign: 'left',
            valign: 'middle',
            fontSize: 8,
            cellPadding: 2,
            lineWidth: 0.5,
          },
          headStyles: {
            fillColor: [200, 200, 200],
            textColor: 20,
            lineWidth: 0.5,
          },
          bodyStyles: { textColor: 20, lineWidth: 0.5 },
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated on: ${generatedDate}`,
        14,
        doc.internal.pageSize.height - 10
      );

      doc.save(
        `billing_summary_${startDate}${endDate ? `_to_${endDate}` : ''}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }

    setIsDateDialogOpen(false);
    setStartDate('');
    setEndDate('');
  };

  return (
    <>
      <Button onClick={() => setIsDateDialogOpen(true)} variant="secondary">
        <Download className="w-4 h-4 mr-2" />
        Download Summary
      </Button>

      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Generate Billing Summary
            </DialogTitle>
            <DialogDescription>
              Select date range for your billing summary report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                max={currentDate}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date (Optional)</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!startDate}
                min={startDate}
                max={currentDate}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDateDialogOpen(false);
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={generatePDF}
                disabled={
                  billsLoading ||
                  companyLoading ||
                  !startDate ||
                  billsError ||
                  companyError
                }
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
