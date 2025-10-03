"use client";
import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { useGetCompanyQuery } from '@/features/CompanyApi';

function formatCurrency(n, currencySymbol = "₨") {
  const num = Number(n || 0);
  return num.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ` ${currencySymbol}`;
}

function buildHtml(bill, companyData) {
  // Fallback values if companyData is not available
  const storeName = companyData?.name || "Store Name";
  const storeAddr = companyData?.address || "Address not provided";
  const storePhone = companyData?.contactPhone || "N/A";
  const currencySymbol = companyData?.invoiceSettings?.currency?.symbol || "₨";
  const terms = companyData?.invoiceSettings?.terms || "Used items are non-refundable.";
  const fontSize = companyData?.invoiceSettings?.thermalPrint?.fontSize || 11;
  const paperWidth = companyData?.invoiceSettings?.thermalPrint?.paperWidth || 80;
  const showLogo = companyData?.invoiceSettings?.thermalPrint?.showLogo ?? true;
  const logoUrl = companyData?.companyLogo || "";
  const taxRate = bill?.paymentMethod === "cash"
    ? companyData?.invoiceSettings?.tax?.taxRateCash || 0
    : companyData?.invoiceSettings?.tax?.taxRateCard || 0;

  const createdAt = bill?.createdAt ? new Date(bill.createdAt) : new Date();
  const billNo =
    bill?.billNumber ||
    (bill?._id
      ? `${companyData?.invoiceSettings?.format?.prefix || ""}${bill._id.slice(-6).toUpperCase()}`
      : "—");

  const itemsHtml = (bill?.items || [])
    .map((it) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.price || 0);
      const line = Number(it.lineTotal ?? it.total ?? qty * price);
      return `
        <div style="margin: 1.5mm 0;">
          <div style="display:flex;justify-content:space-between;gap:2mm;">
            <span style="max-width:55mm;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${(it.itemName || "").toString()}${it.variantName ? ` — ${it.variantName}` : ""}
            </span>
            <span>${formatCurrency(line, currencySymbol)}</span>
          </div>
          <div style="font-size:${fontSize - 1}px;opacity:.9;">
            ${qty} × ${formatCurrency(price, currencySymbol)}${it.sku ? ` • ${it.sku}` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  const subtotal = Number(bill?.subtotal || 0);
  const taxAmount = Number(bill?.taxAmount || subtotal * (taxRate / 100));
  const total = Number(bill?.total || subtotal + taxAmount);
  const taxPercent = taxRate !== undefined && taxRate !== null ? `${taxRate}%` : "—";

  const paymentMethod = (bill?.paymentMethod || "cash").toString().toUpperCase();
  const status = (bill?.status || "").toString().toUpperCase();
  const buyerName = bill?.buyer?.name || "Walk-in";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${billNo}</title>
  <style>
    @media print {
      @page { size: ${paperWidth}mm auto; margin: 0; }
      body { margin: 0; }
    }
    body {
      width: ${paperWidth}mm;
      margin: 0;
      padding: 3mm 3mm 5mm;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: ${fontSize}px;
      line-height: 1.35;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      box-sizing: border-box;
    }
    .text-center { text-align:center; }
    .muted { opacity: .9; }
    .divider { border-bottom: 1px dashed #000; margin: 2mm 0; }
    .header {
      margin-bottom: 2mm;
    }
    .store-name {
      font-size: ${fontSize + 2}px;
      font-weight: 700;
      letter-spacing: .2px;
      margin: 0 0 1mm 0;
    }
    .meta { display:flex; justify-content:space-between; gap: 3mm; }
    .totals-row { display:flex; justify-content:space-between; gap: 3mm; }
    .label { opacity:.9; }
    .grand {
      font-weight: 700;
      font-size: ${fontSize + 1}px;
    }
    .footer {
      margin-top: 3mm;
      text-align: center;
      opacity: .95;
    }
  </style>
</head>
<body>
  <div class="header">
    ${showLogo && logoUrl ? `<img src="${logoUrl}" style="max-width:30mm;margin:0 auto 1mm;display:block;" />` : ""}
    <div class="text-center store-name">${storeName}</div>
    <div class="text-center muted" style="white-space:pre-wrap">${storeAddr}</div>
    <div class="text-center muted">Phone: ${storePhone}</div>
  </div>

  <div class="divider"></div>

  <div class="meta">
    <span><span class="label">Bill #:</span> ${billNo}</span>
    <span>${createdAt.toLocaleString("en-PK")}</span>
  </div>

  <div class="meta" style="margin-top:1mm;">
    <span><span class="label">Customer:</span> ${buyerName}</span>
    <span><span class="label">Status:</span> ${status}</span>
  </div>

  <div class="divider"></div>

  <div class="totals-row" style="font-weight:700;">
    <span>ITEM</span><span>TOTAL</span>
  </div>
  <div class="divider" style="margin-top:1mm;"></div>

  ${itemsHtml}

  <div class="divider"></div>

  <div class="totals-row">
    <span class="label">Subtotal:</span>
    <span>${formatCurrency(subtotal, currencySymbol)}</span>
  </div>
  <div class="totals-row">
    <span class="label">Tax (${taxPercent}):</span>
    <span>${formatCurrency(taxAmount, currencySymbol)}</span>
  </div>

  <div class="divider" style="margin-top:1.5mm;"></div>

  <div class="totals-row grand">
    <span>TOTAL:</span>
    <span>${formatCurrency(total, currencySymbol)}</span>
  </div>

  <div class="divider" style="margin-top:1.5mm;"></div>

  <div class="totals-row">
    <span class="label">Payment:</span>
    <span>${paymentMethod}</span>
  </div>

  <div class="footer">
    <div>Thank you for your purchase!</div>
    <div>** Terms & Conditions **</div>
    <div style="white-space:pre-wrap">${terms}</div>
  </div>
</body>
</html>`;
}

const ThermalPrintSlip = forwardRef(function ThermalPrintSlip(_props, ref) {
  const iframeRef = useRef(null);
  const { data: companyData, isLoading: companyLoading } = useGetCompanyQuery();

  useImperativeHandle(ref, () => ({
    print(bill) {
      if (companyLoading) {
        console.warn("Company data is still loading, cannot print yet.");
        return;
      }
      try {
        const html = buildHtml(bill, companyData?.data);

        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
        iframeRef.current = iframe;

        const doc = iframe.contentWindow?.document;
        if (!doc) throw new Error("Unable to access iframe document");
        doc.open();
        doc.write(html);
        doc.close();

        const win = iframe.contentWindow;
        const doPrint = () => {
          try {
            win?.focus();
            setTimeout(() => {
              win?.print();
              setTimeout(() => {
                iframe.parentNode?.removeChild(iframe);
              }, 300);
            }, 120);
          } catch (err) {
            console.error("Print error:", err);
            iframe.parentNode?.removeChild(iframe);
          }
        };

        if ("onload" in iframe) {
          iframe.onload = doPrint;
        } else {
          setTimeout(doPrint, 200);
        }
      } catch (err) {
        console.error("Thermal print failed:", err);
      }
    },
  }));

  useEffect(() => {
    return () => {
      if (iframeRef.current?.parentNode) {
        try {
          iframeRef.current.parentNode.removeChild(iframeRef.current);
        } catch {}
      }
    };
  }, []);

  return null;
});

export default ThermalPrintSlip;