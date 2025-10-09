'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

function toDateOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function inRange(dateStr, start, end) {
  const d = toDateOnly(dateStr);
  if (!d) return false;
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}
function currency(n) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** Pure generator: build summary stats from logs + date range */
function generateSummary({ startDate, endDate, logs }) {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!start || !end || start > end) return null;

  // rows filtered by date range
  const rows = (logs || []).filter((r) =>
    inRange(r?.processedAt || r?.date, start, end)
  );

  let totalSalary = 0;
  let totalBonus = 0;
  let totalDec = 0;
  let totalPaid = 0;

  const perStaff = new Map();

  for (const r of rows) {
    const baseSalary = Number(r?.baseSalary || 0);
    const bonusAmount = Number(r?.bonusAmount || 0);
    const decrementAmount = Number(r?.decrementAmount || 0);
    const paid =
      Number(r?.totalPaid) || baseSalary + bonusAmount - decrementAmount;

    totalSalary += baseSalary;
    totalBonus += bonusAmount;
    totalDec += decrementAmount;
    totalPaid += paid;

    const key = String(r?.staffId || 'UNKNOWN');
    if (!perStaff.has(key)) {
      perStaff.set(key, {
        staffId: key,
        staffName: r?.staffName || 'Unknown',
        salary: 0,
        bonus: 0,
        dec: 0,
        paid: 0,
        count: 0,
      });
    }
    const s = perStaff.get(key);
    s.salary += baseSalary;
    s.bonus += bonusAmount;
    s.dec += decrementAmount;
    s.paid += paid;
    s.count += 1;
  }

  const staffList = Array.from(perStaff.values()).sort(
    (a, b) => b.paid - a.paid
  );

  return {
    start: startDate,
    end: endDate,
    totalSalary,
    totalBonus,
    totalDec,
    totalPaid,
    countPayments: rows.length,
    countUniqueStaff: staffList.length,
    staffList,
    rows, // <-- include detailed rows so we can print paymentType & paymentMethod per payment
  };
}

/** Standalone HTML (no Tailwind) */
function buildPrintHTML({ companyName, generated }) {
  const {
    start,
    end,
    countPayments,
    countUniqueStaff,
    totalPaid,
    totalSalary,
    totalBonus,
    totalDec,
    staffList,
    rows, // detailed rows
  } = generated;

  // Aggregated per-staff table (no payment type column here because it’s aggregated)
  const perStaffRows = staffList
    .map(
      (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.staffName}</td>
        <td class="right">${currency(s.salary)}</td>
        <td class="right">${currency(s.bonus)}</td>
        <td class="right">${currency(s.dec)}</td>
        <td class="right">${currency(s.paid)}</td>
        <td class="right">${s.count}</td>
      </tr>`
    )
    .join('');

  // Detailed payments table (includes paymentType + paymentMethod)
  const detailedRows = (rows || [])
    .map((r, i) => {
      const dateStr = new Date(
        r?.processedAt || r?.date || Date.now()
      ).toLocaleDateString();
      const staffName = r?.staffName || r?.staff?.name || 'Unknown';
      const salary = Number(r?.baseSalary || 0);
      const bonus = Number(r?.bonusAmount || 0);
      const dec = Number(r?.decrementAmount || 0);
      const paid = Number(r?.totalPaid || salary + bonus - dec);
      const pType = r?.paymentType || '—';
      const pMethod = r?.paymentMethod || '—';
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${dateStr}</td>
          <td>${staffName}</td>
          <td>${pType}</td>
          <td>${pMethod}</td>
          <td class="right">${currency(salary)}</td>
          <td class="right">${currency(bonus)}</td>
          <td class="right">${currency(dec)}</td>
          <td class="right">${currency(paid)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${companyName} - Company Summary (${start} – ${end})</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0b0b0c; margin: 0; }
          .container { padding: 24px; }
          h1 { font-size: 22px; margin: 0; font-weight: 600; }
          h2 { font-size: 16px; margin: 20px 0 10px; }
          p, li, td, th { font-size: 12px; }
          .center { text-align: center; }
          .muted { color: #6b7280; }
          .grid6 { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
          .kpi-title { font-size: 11px; color: #6b7280; }
          .kpi-value { font-size: 14px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          thead th { position: sticky; top: 0; background: #f9fafb; border-bottom: 1px solid #e5e7eb; text-align: left; padding: 8px; }
          tbody td { border-bottom: 1px solid #f0f1f3; padding: 8px; }
          tbody tr:nth-child(even) { background: #fafafa; }
          .right { text-align: right; }
          .small { font-size: 11px; }
          .footer-note { margin-top: 12px; }
          @media (max-width: 900px) {
            .grid6 { grid-template-columns: repeat(3, minmax(0,1fr)); }
          }
          @media print {
            @page { margin: 12mm; }
            .grid6 { gap: 8px; }
            .card { border-color: #e5e7eb; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Centered header -->
          <div class="center" style="margin-bottom: 24px;">
            <h1>${companyName}</h1>
            <p style="margin: 4px 0 0; font-size: 16px; font-weight: 500;">Company Summary</p>
            <p class="muted" style="margin: 2px 0 0; font-size: 13px;">Period: ${start} – ${end}</p>
          </div>

          <div class="grid6">
            <div class="card">
              <div class="kpi-title">Total Payments</div>
              <div class="kpi-value">${countPayments}</div>
            </div>
            <div class="card">
              <div class="kpi-title">Total Salary</div>
              <div class="kpi-value">${currency(totalSalary)}</div>
            </div>
            <div class="card">
              <div class="kpi-title">Total Bonus</div>
              <div class="kpi-value">${currency(totalBonus)}</div>
            </div>
            <div class="card">
              <div class="kpi-title">Total Deduction</div>
              <div class="kpi-value">${currency(totalDec)}</div>
            </div>
            <div class="card">
              <div class="kpi-title">Total Paid</div>
              <div class="kpi-value">${currency(totalPaid)}</div>
            </div>
            <div class="card">
              <div class="kpi-title">Unique Staff</div>
              <div class="kpi-value">${countUniqueStaff}</div>
            </div>
          </div>

          <!-- Aggregated per-staff table -->
          <h2>Staff Totals</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Staff</th>
                <th class="right">Salary</th>
                <th class="right">Bonus</th>
                <th class="right">Deduction</th>
                <th class="right">Paid</th>
                <th class="right">Payments</th>
              </tr>
            </thead>
            <tbody>${perStaffRows}</tbody>
          </table>

          <!-- Detailed payments table with paymentType + paymentMethod -->
          <h2>Payments (Detailed)</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Staff</th>
                <th>Payment Type</th>
                <th>Payment Method</th>
                <th class="right">Salary</th>
                <th class="right">Bonus</th>
                <th class="right">Deduction</th>
                <th class="right">Paid</th>
              </tr>
            </thead>
            <tbody>${detailedRows}</tbody>
          </table>

          <p class="muted small footer-note">Generated on ${new Date().toLocaleString()}</p>
        </div>
        <script>
          window.addEventListener('load', () => setTimeout(() => { window.print(); }, 100));
        </script>
      </body>
    </html>
  `;
}

export default function CompanySummaryDialog({
  open,
  onOpenChange,
  logs = [],
  companyName = 'Alpha AutoMotive Industory',
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /** One-click: validate -> generate -> print */
  const handlePrint = (e) => {
    e?.preventDefault?.();

    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    const generated = generateSummary({ startDate, endDate, logs });
    if (!generated) {
      alert('Invalid date range.');
      return;
    }

    const html = buildPrintHTML({ companyName, generated });

    // Blob URL in a new tab (best case)
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');

    if (win && !win.closed) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }, 30000);
      return;
    }

    // Fallback: hidden iframe (works even with popup blockers)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;

    iframe.onload = () => {
      try {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          URL.revokeObjectURL(url);
          document.body.removeChild(iframe);
        }, 100);
      } catch {
        const dataUrl =
          'data:text/html;charset=utf-8,' + encodeURIComponent(html);
        window.location.href = dataUrl;
      }
    };

    document.body.appendChild(iframe);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          // Reset dates when the dialog is closed
          setStartDate('');
          setEndDate('');
        }
        onOpenChange?.(v);
      }}
    >
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Company Summary</DialogTitle>
          <DialogDescription>
            Select a date range to print the summary.
          </DialogDescription>
        </DialogHeader>

        {/* One row: dates; Next row: single Print button */}
        <form
          onSubmit={handlePrint}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end"
        >
          <div>
            <label className="text-sm text-muted-foreground">Start date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">End date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">
              Print / Save PDF
            </Button>
          </div>
        </form>

        <DialogFooter>{/* optional buttons */}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
