'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { billsApi } from '@/features/billingApi';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  header: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 10 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1 },
  tableRow: { flexDirection: 'row' },
  tableCol: { borderStyle: 'solid', borderWidth: 1, padding: 5 },
  tableHeader: { fontWeight: 'bold', backgroundColor: '#f0f0f0' },
  text: { marginBottom: 5 },
});

const BillingSummaryPDF = ({ currencySymbol = '€' }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const response = await billsApi.getBills();
        setBills(response.data || []);
      } catch (error) {
        console.log(`({
          title: 'Error',
          description: 'Failed to fetch bills for PDF',
          variant: 'destructive',
        })`);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const generatePDF = async () => {
    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Billing Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text>Bill #</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text>Customer</Text>
              </View>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text>Items</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text>Amount</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text>Status</Text>
              </View>
            </View>
            {bills.map((bill) => (
              <View key={bill._id} style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '20%' }]}>
                  <Text>{bill.billNumber}</Text>
                </View>
                <View style={[styles.tableCol, { width: '20%' }]}>
                  <Text>{bill.buyer?.name || '—'}</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
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
                  <Text>{currencySymbol}{Number(bill.total || 0).toFixed(2)}</Text>
                </View>
                <View style={[styles.tableCol, { width: '15%' }]}>
                  <Text>{bill.status.replace('_', ' ')}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={styles.text}>
              Total Bills: {bills.length}
            </Text>
            <Text style={styles.text}>
              Total Revenue: {currencySymbol}
              {bills
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
    link.download = `billing_summary_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={generatePDF} disabled={loading || bills.length === 0}>
      <Download className="w-4 h-4 mr-2" />
      {loading ? 'Generating...' : 'Download Summary PDF'}
    </Button>
  );
};

export default BillingSummaryPDF;