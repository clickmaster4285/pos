// utils/awbUtils.js
export function printAwbWindow(
  awb,
  courier,
  recipient,
  cod = { enabled: false, amount: 0 },
  createdAt, // already formatted string (e.g., formatDateTime(s.createdAt))
  options = {}
) {
  // Optional extras you can pass via options
  const {
    currencySymbol = '', // e.g. 'PKR' or '₨'
    fromAddress = '', // if you have it
    toAddress = '', // if you have it
    toCity = '', // if you have it
    serviceLevel = '', // if you have it
    logoUrl = '', // small logo in header
    footerNote = 'Local demo label. Not valid for shipment.',
  } = options;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;

  // Quick helpers
  const safe = (v) => (v == null ? '' : String(v));
  const yesNo = (b) => (b ? 'Yes' : 'No');

  // Simple inline SVG “barcode” look (text + bars). Still readable if it doesn’t render perfectly.

  w.document.write(`
    <html>
      <head>
        <title>AWB ${safe(awb)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root {
            --fg:#111;
            --muted:#6b7280; /* gray-500 */
            --border:#e5e7eb; /* gray-200 */
            --accent:#111;
          }
          @page { size: A5 landscape; margin: 10mm; } /* nice label size */
          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          }
          * { box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif;
            color: var(--fg);
            background: #fff;
            padding: 16px;
          }
          .sheet {
            border: 2px dashed var(--fg);
            border-radius: 10px;
            padding: 16px;
          }
          .header {
            display:flex; align-items:center; justify-content:space-between; gap:12px;
            margin-bottom: 10px;
          }
          .logo { height: 28px; object-fit: contain; }
          .title {
            font-weight: 700; font-size: 18px; letter-spacing: .4px;
          }
          .meta-grid {
            display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px;
          }
          .cell { border:1px solid var(--border); border-radius:8px; padding:8px; }
          .label { font-size: 11px; color: var(--muted); margin-bottom:4px; }
          .value { font-weight: 600; font-size: 14px; }
          .section {
            border:1px solid var(--border); border-radius:8px; padding:10px; margin-top:8px;
          }
          .row { display:flex; gap:12px; }
          .col { flex:1; }
          .barcode { margin-top: 10px; border:1px dashed var(--border); border-radius:8px; padding:8px; }
          .footer {
            display:flex; justify-content:space-between; align-items:center; margin-top: 8px;
            font-size: 11px; color: var(--muted);
          }
          .big { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
          .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .5px; }
          .pill { display:inline-block; padding:2px 8px; border:1px solid var(--border); border-radius:999px; font-size:11px; }
          .btn {
            border:1px solid var(--border); background:#f8fafc; padding:6px 10px; border-radius:8px; cursor:pointer;
          }
        </style>
      </head>
      <body>
        <div class="sheet" role="document" aria-label="AirWayBill Label">
          <div class="header">
            <div style="display:flex; align-items:center; gap:10px;">
              
              <div class="title">AirWayBill</div>
            </div>
            <div class="mono">Generated: ${safe(createdAt) || ''}</div>
          </div>

          <div class="meta-grid">
            <div class="cell">
              <div class="label">AWB</div>
              <div class="value big mono">${safe(awb)}</div>
            </div>
            <div class="cell">
              <div class="label">Courier</div>
              <div class="value">${safe(courier) || '—'}</div>
            </div>
            <div class="cell">
              <div class="label">Recipient</div>
              <div class="value">${safe(recipient) || '—'}</div>
            </div>
            <div class="cell">
              <div class="label">COD</div>
              <div class="value">
                ${yesNo(!!cod?.enabled)}
                ${
                  cod?.enabled
                    ? `<span class="mono" style="margin-left:6px;">${Number(
                        cod.amount || 0
                      ).toFixed(2)} ${safe(currencySymbol)}</span>`
                    : ''
                }
              </div>
            </div>
          </div>

          <div class="section row">
            <div class="col">
              <div class="label">From</div>
              <div class="value" style="white-space:pre-line;">${
                safe(fromAddress) || '—'
              }</div>
            </div>
            <div class="col">
              <div class="label">To</div>
              <div class="value" style="white-space:pre-line;">
                ${safe(toAddress) || '—'}${toCity ? `, ${safe(toCity)}` : ''}
              </div>
            </div>
          </div>

          <div class="section row">
            <div class="col">
              <div class="label">Service</div>
              <div class="value">${safe(serviceLevel) || '—'}</div>
            </div>
            <div class="col">
              <div class="label">Reference</div>
              <div class="value mono">${safe(awb)}</div>
            </div>
          </div>

        

          <div class="footer">
            <div>${safe(footerNote)}</div>
            <div class="mono">© ${new Date().getFullYear()}</div>
          </div>
        </div>

        <div class="no-print" style="margin-top:12px; display:flex; gap:8px;">
          <button class="btn" onclick="window.print()">Print</button>
          <button class="btn" onclick="window.close()">Close</button>
        </div>

        <script>
          // Give the new window a tick to render before printing.
          window.onload = () => setTimeout(() => window.print(), 150);
        </script>
      </body>
    </html>
  `);

  w.document.close();
}
