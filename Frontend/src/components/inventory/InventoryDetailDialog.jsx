'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Package, Download, AlertTriangle } from 'lucide-react';
import { useGetInventoryByIdQuery } from '@/features/inventoryApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

function SummaryCard({ title, value, icon: Icon, className = '' }) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
      </div>
    </div>
  );
}

export default function InventoryDetailDialog({
  open,
  onClose,
  item,
  currencySymbol,
}) {
  const contentRef = useRef();
  const { data: inventoryData, isLoading } = useGetInventoryByIdQuery(
    item?.id || item?._id,
    {
      skip: !open || !item,
    }
  );

  // console.log('inventoryData are :', inventoryData);
  const downloadPDF = () => {
    const doc = new jsPDF();
    const { inventoryItem } = inventoryData;
    // Title
    doc.setFontSize(20);
    doc.text(`Inventory Details - ${inventoryItem.itemName}`, 14, 15);

    // Summary Section
    doc.setFontSize(12);
    doc.text('Summary Overview', 14, 30);

    const summaryData = [
      ['Total Stock', inventoryItem.quantity],
      ['Incoming Stock', inventoryItem.incomingQuantity],
      [
        'Total Price',
        ` ${currencySymbol}${inventoryItem.totalPrice?.toLocaleString()}`,
      ],
      [
        'Total Cost',
        ` ${currencySymbol}${inventoryItem.totalCostPrice?.toLocaleString()}`,
      ],
      ['Variants', inventoryItem.totalVariants],
      ['Location', inventoryItem.location],
      ['Status', inventoryItem.isActive ? 'Active' : 'Inactive'],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
    });

    // Variants Section
    doc.text('Variants Details', 14, doc.lastAutoTable.finalY + 15);

    const variantsData =
      inventoryItem.variants?.map((variant) => [
        variant.variantName,
        variant.sku,
        variant.quantity,
        variant.incomingQuantity,
        ` ${currencySymbol}${variant.price}`,
        ` ${currencySymbol}${variant.costPrice}`,
        variant.quantity <= variant.lowStockThreshold ? 'LOW STOCK' : 'OK',
      ]) || [];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Variant', 'SKU', 'Qty', 'Incoming', 'Price', 'Cost', 'Status']],
      body: variantsData,
      theme: 'grid',
    });

    // History Section
    doc.text('Stock History', 14, doc.lastAutoTable.finalY + 15);

    const historyData =
      [...inventoryItem.history]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((history) => [
          history.action,
          history.performedBy,
          history.description || 'N/A',
          new Date(history.createdAt).toLocaleDateString(),
          history.variantChanges?.length || 0,
        ]) || [];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Action', 'By', 'Description', 'Date', 'Variant Changes']],
      body: historyData,
      theme: 'grid',
    });

    doc.save(
      `inventory-${inventoryItem.itemName}-${
        new Date().toISOString().split('T')[0]
      }.pdf`
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">Loading inventory details...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!inventoryData?.success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-rose-700">
            Failed to load inventory details.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { inventoryItem } = inventoryData;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        // width & scrolling similar to your DialogContent
        className="w-[70rem] max-w-[95vw] h-full p-0"
        ref={contentRef}
      >
        {/* Scrollable body */}
        <div className="h-full overflow-y-auto p-6">
          <SheetHeader className="p-0 mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {inventoryItem.itemName} - Inventory Details
            </SheetTitle>
            {/* optional: <SheetDescription /> if you had one */}
          </SheetHeader>

          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard title="Total Stock" value={inventoryItem.quantity} />
              <SummaryCard
                title="Incoming Stock"
                value={inventoryItem.incomingQuantity}
              />
              <SummaryCard
                title="Total Price"
                value={`  ${currencySymbol}${inventoryItem.totalPrice?.toLocaleString()}`}
              />
              <SummaryCard
                title="Total Cost"
                value={` ${currencySymbol}${inventoryItem.totalCostPrice?.toLocaleString()}`}
              />
            </div>

            {/* Variants Table */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">
                  Product Variants ({inventoryItem.totalVariants})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 text-sm font-medium">
                        Variant
                      </th>
                      <th className="text-left p-3 text-sm font-medium">SKU</th>
                      <th className="text-left p-3 text-sm font-medium">
                        Stock
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Incoming
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Price
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Cost
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItem.variants?.map((variant) => (
                      <tr key={variant._id} className="border-b">
                        <td className="p-3">
                          <div className="font-medium">
                            {variant.variantName}
                          </div>
                          {variant.attributes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {Object.entries(variant.attributes).map(
                                ([key, value]) => (
                                  <span key={key} className="mr-2">
                                    {key}: {value}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-sm">{variant.sku}</td>
                        <td className="p-3">{variant.quantity}</td>
                        <td className="p-3">{variant.incomingQuantity}</td>
                        <td className="p-3">
                          {' '}
                          {currencySymbol}
                          {variant.price}
                        </td>
                        <td className="p-3">
                          {' '}
                         {currencySymbol}
                          {variant.costPrice}
                        </td>
                        <td className="p-3">
                          {variant.quantity <= variant.lowStockThreshold ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* History Table */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">
                  Stock History ({inventoryItem.history?.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 text-sm font-medium">
                        Action
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Performed By
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Description
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Date & Time
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Changes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...inventoryItem.history]
                      .sort(
                        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                      )
                      .map((history) => (
                        <tr key={history.id} className="border-b">
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                history.action === 'created'
                                  ? 'bg-green-100 text-green-800'
                                  : history.action === 'info_updated'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {history.action.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 font-medium">
                            {history.performedBy}
                          </td>
                          <td className="p-3 text-sm">
                            {history.description || 'N/A'}
                          </td>
                          <td className="p-3 text-sm">
                            {new Date(history.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3">
                            {history.variantChanges?.map((change, idx) => (
                              <div
                                key={idx}
                                className="text-xs bg-muted p-2 rounded mb-1"
                              >
                                <div>
                                  <strong>{change.variantName}</strong>
                                </div>
                                <div>
                                  Change: {change.change > 0 ? '+' : ''}
                                  {change.change}
                                </div>
                                <div>
                                  Previous: {change.previousQuantity} → New:{' '}
                                  {change.newQuantity}
                                </div>
                              </div>
                            ))}
                            {!history.variantChanges?.length && (
                              <span className="text-muted-foreground text-sm">
                                No variant changes
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <SheetFooter className="pt-2">
              <div className="ml-auto flex items-center gap-2">
                <Button
                  onClick={downloadPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
