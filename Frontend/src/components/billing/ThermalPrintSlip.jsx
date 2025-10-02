'use client';
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';

function formatPKR(n) {
  const num = Number(n || 0);
  return num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildHtml(bill) {
  // ===== Store info (feel free to tweak) =====
  const storeName = 'Alpha Automotive Industry';
  const storeAddr = 'Plot #12, Industrial Area, I-9, Islamabad';
  const storePhone = '(+92) 300-0000000';

  const createdAt = bill?.createdAt ? new Date(bill.createdAt) : new Date();
  const billNo =
    bill?.billNumber || (bill?._id ? bill._id.slice(-6).toUpperCase() : '—');

  const itemsHtml = (bill?.items || [])
    .map((it) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.price || 0);
      const line = Number(it.lineTotal ?? it.total ?? qty * price);
      return `
        <div style="margin: 1.5mm 0;">
          <div style="display:flex;justify-content:space-between;gap:2mm;">
            <span style="max-width:55mm;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${(it.itemName || '').toString()}${
        it.variantName ? ` — ${it.variantName}` : ''
      }
            </span>
            <span>PKR ${formatPKR(line)}</span>
          </div>
          <div style="font-size:10px;opacity:.9;">
            ${qty} × PKR ${formatPKR(price)}${it.sku ? ` • ${it.sku}` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  const subtotal = Number(bill?.subtotal || 0);
  const taxAmount = Number(bill?.taxAmount || 0);
  const total = Number(bill?.total || subtotal + taxAmount);
  const taxPercent =
    bill?.taxPercent !== undefined && bill?.taxPercent !== null
      ? `${Number(bill.taxPercent)}%`
      : '—';

  const paymentMethod = (bill?.paymentMethod || 'cash')
    .toString()
    .toUpperCase();
  const status = (bill?.status || '').toString().toUpperCase();
  const buyerName = bill?.buyer?.name || 'Walk-in';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${billNo}</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; }
    }
    body {
      width: 80mm;
      margin: 0;
      padding: 3mm 3mm 5mm;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;               /* smaller base font */
      line-height: 1.35;             /* better readability */
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
      font-size: 13px;               /* smaller store title */
      font-weight: 700;
      letter-spacing: .2px;          /* subtle tightening */
      margin: 0 0 1mm 0;
    }
    .meta { display:flex; justify-content:space-between; gap: 3mm; }
    .totals-row { display:flex; justify-content:space-between; gap: 3mm; }
    .label { opacity:.9; }
    .grand {
      font-weight: 700;
      font-size: 12px;               /* slightly larger for emphasis */
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
    <div class="text-center store-name">${storeName}</div>
    <div class="text-center muted" style="white-space:pre-wrap">${storeAddr}</div>
    <div class="text-center muted">Phone: ${storePhone}</div>
  </div>

  <div class="divider"></div>

  <div class="meta">
    <span><span class="label">Bill #:</span> ${billNo}</span>
    <span>${createdAt.toLocaleString('en-PK')}</span>
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
    <span>PKR ${formatPKR(subtotal)}</span>
  </div>
  <div class="totals-row">
    <span class="label">Tax (${taxPercent}):</span>
    <span>PKR ${formatPKR(taxAmount)}</span>
  </div>

  <div class="divider" style="margin-top:1.5mm;"></div>

  <div class="totals-row grand">
    <span>TOTAL:</span>
    <span>PKR ${formatPKR(total)}</span>
  </div>

  <div class="divider" style="margin-top:1.5mm;"></div>

  <div class="totals-row">
    <span class="label">Payment:</span>
    <span>${paymentMethod}</span>
  </div>

  <div class="footer">
    <div>Thank you for your purchase!</div>
    <div>** Terms & Conditions **</div>
    <div>Used items are non-refundable.</div>
    <div>Changes allowed within three days.</div>
  </div>
</body>
</html>`;
}

const ThermalPrintSlip = forwardRef(function ThermalPrintSlip(_props, ref) {
  const iframeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    print(bill) {
      try {
        const html = buildHtml(bill);

        // Hidden iframe approach (reliable across browsers)
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        iframeRef.current = iframe;

        const doc = iframe.contentWindow?.document;
        if (!doc) throw new Error('Unable to access iframe document');
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
            console.error('Print error:', err);
            iframe.parentNode?.removeChild(iframe);
          }
        };

        if ('onload' in iframe) {
          iframe.onload = doPrint;
        } else {
          setTimeout(doPrint, 200);
        }
      } catch (err) {
        console.error('Thermal print failed:', err);
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
