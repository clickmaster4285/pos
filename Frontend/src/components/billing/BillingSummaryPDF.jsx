'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Calendar } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { useGetBillsQuery } from '@/features/billingApi';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8 },
  header: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 10 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1 },
  tableRow: { flexDirection: 'row' },
  tableCol: { borderStyle: 'solid', borderWidth: 1, padding: 5 },
  tableHeader: { fontWeight: 'bold', backgroundColor: '#f0f0f0' },
  text: { marginBottom: 5 },
});

const BillingSummaryPDF = ({ currencySymbol = '€' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const dropdownRef = useRef(null);

  // ✅ Correct way to fetch using RTK Query
  const { data, isLoading, isError } = useGetBillsQuery({ page: 1, limit: 1000 });
  const bills = data?.data || [];

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Date filtering function
  const filterBillsByDate = (bills, start, end) => {
    if (!start) return bills;
    const startDateObj = new Date(start);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = end ? new Date(end) : new Date(start);
    endDateObj.setHours(23, 59, 59, 999);

    return bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startDateObj && billDate <= endDateObj;
    });
  };

  // ✅ Generate full PDF
  const generateFullPDF = async () => {
    console.log('Generating full PDF');
    await generatePDF(bills, 'Billing Summary - Full Report');
    setIsDropdownOpen(false);
  };

  // ✅ Generate date range PDF
  const generateDateRangePDF = async () => {
    if (!startDate) {
      alert('Please select at least a start date.');
      return;
    }
    console.log('Generating date range PDF:', { startDate, endDate });
    const filteredBills = filterBillsByDate(bills, startDate, endDate);
    const title = endDate
      ? `Billing Summary - ${startDate} to ${endDate}`
      : `Billing Summary - ${startDate}`;
    await generatePDF(filteredBills, title);
    setIsDropdownOpen(false);
    setShowDatePicker(false);
    setStartDate('');
    setEndDate('');
  };

  // ✅ PDF generation logic
  const generatePDF = async (billsToExport, title) => {
    try {
      const doc = (
        <Document>
          <Page size="A4" style={styles.page}>
            <Text style={styles.header}>{title}</Text>
            <Text style={styles.text}>Generated on: {new Date().toLocaleString()}</Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCol, { width: '5%' }]}>
                  <Text>Sr.</Text>
                </View>
                <View style={[styles.tableCol, { width: '35%' }]}>
                  <Text>Bill #</Text>
                </View>
                <View style={[styles.tableCol, { width: '20%' }]}>
                  <Text>Customer</Text>
                </View>
                <View style={[styles.tableCol, { width: '15%' }]}>
                  <Text>Items</Text>
                </View>
                <View style={[styles.tableCol, { width: '15%' }]}>
                  <Text>Amount</Text>
                </View>
                <View style={[styles.tableCol, { width: '10%' }]}>
                  <Text>Status</Text>
                </View>
              </View>

              {/* Table Rows */}
              {billsToExport.map((bill, index) => (
                <View key={bill._id} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: '5%' }]}>
                    <Text>{index+1}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '35%' }]}>
                    <Text>{bill.billNumber}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '20%' }]}>
                    <Text>{bill.buyer?.name || '—'}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '15%' }]}>
                    {bill.items.slice(0, 2).map((item, i) => (
                      <Text key={i}>
                        {item.quantity}x {item.itemName} ({item.categoryName})
                      </Text>
                    ))}
                    {bill.items.length > 2 && (
                      <Text>+{bill.items.length - 2} more</Text>
                    )}
                  </View>
                  <View style={[styles.tableCol, { width: '15%' }]}>
                    <Text>
                      {currencySymbol}
                      {Number(bill.total || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.tableCol, { width: '10%' }]}>
                    <Text>{bill.status?.replace('_', ' ')}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.section}>
              <Text style={styles.text}>Total Bills: {billsToExport.length}</Text>
              <Text style={styles.text}>
                Total Revenue: {currencySymbol}
                {billsToExport
                  .filter((b) => b.status === 'paid')
                  .reduce((sum, b) => sum + (b.total || 0), 0)
                  .toFixed(2)}
              </Text>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `billing_summary_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      console.log('PDF generated successfully:', title);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading || bills.length === 0}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Download className="w-4 h-4 mr-2" />
        {isLoading ? 'Fetching Bills...' : 'Download Summary PDF'}
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 z-20">
          <div className="p-2">
            <button
              onClick={generateFullPDF}
              className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors duration-150 text-sm font-medium"
            >
              Full Report
            </button>

            <button
              onClick={() => setShowDatePicker(true)}
              className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors duration-150 text-sm font-medium"
            >
              Date Range Report
            </button>
          </div>

          {showDatePicker && (
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="pl-10 bg-white/10 border-slate-200 text-slate-700"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                    className="pl-10 bg-white/10 border-slate-200 text-slate-700"
                  />
                </div>

                <Button
                  onClick={generateDateRangePDF}
                  disabled={isLoading || !startDate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Generate Date Range PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillingSummaryPDF;
