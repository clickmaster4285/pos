'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Printer, Download } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

export default function BarcodeDialog({ open, onClose, sku, variantName, itemName, onGenerate }) {
  const canvasRef = useRef(null);

  // Configurable PDF page size (in mm)
  const pageWidth = 210; // A4 width
  const pageHeight = 297; // A4 height

  // Generate barcode and PDF when dialog opens
  useEffect(() => {
    if (open && sku && canvasRef.current) {
      try {
        // Generate barcode
        JsBarcode(canvasRef.current, sku, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });

        // Generate PDF with specified format
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pageWidth, pageHeight], // Use configurable size
        });

        // Add content to PDF
        pdf.setFontSize(10);
        pdf.text(`${itemName} - ${variantName}`, 10, 20); // Adjusted for A4
        pdf.addImage(canvasRef.current.toDataURL(), 'PNG', 10, 30, 190, 45); // Adjusted for A4

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Open in new tab
        const newWindow = window.open(pdfUrl, '_blank');
        if (newWindow) {
          newWindow.focus();
        } else {
          console.error('Failed to open new tab. Ensure pop-ups are not blocked.');
        }

        // Notify parent
        onGenerate?.({ pdfUrl, pdfBlob });

        // Cleanup
        return () => URL.revokeObjectURL(pdfUrl);
      } catch (err) {
        console.error('Failed to generate barcode or PDF:', err);
      }
    }
  }, [open, sku, itemName, variantName, onGenerate]);

  // Print handler
const handlePrint = () => {
  const dataUrl = canvasRef.current?.toDataURL();
  if (!dataUrl) {
    console.error("Barcode not generated yet.");
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Barcode - ${variantName}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; width: ${pageWidth}mm; }
            .barcode-container { text-align: center; }
            .barcode-title { font-size: 12px; margin-bottom: 5px; }
            @page { size: ${pageWidth}mm ${pageHeight}mm; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="barcode-container">
          <div class="barcode-title">${itemName} - ${variantName}</div>
          <img id="barcode-img" src="${dataUrl}" style="max-width: 100%;" />
        </div>
        <script>
          const img = document.getElementById('barcode-img');
          img.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};



  // Download handler
  const handleDownload = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight], // Use configurable size
    });
    pdf.setFontSize(10);
    pdf.text(`${itemName} - ${variantName}`, 10, 20); // Adjusted for A4
    pdf.addImage(canvasRef.current.toDataURL(), 'PNG', 10, 30, 190, 45); // Adjusted for A4
    pdf.save(`barcode-${sku}.pdf`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-background p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Barcode for {variantName}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {itemName} - SKU: {sku || 'N/A'}
          </p>
          <canvas ref={canvasRef} className="mx-auto" />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-1 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}