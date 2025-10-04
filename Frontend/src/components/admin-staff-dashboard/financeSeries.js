// lib/financeSeries.js

// What counts in revenue/profit
export const SETTINGS = {
  includePendingInRevenue: true, // set false if you only want paid/completed
};

// number coercion
export const N = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// local YYYY-MM-DD (no UTC shift)
export const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export const labelDay = (d) =>
  d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });

export const seedDays = (days = 14) => {
  const today = new Date();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push({
      key: ymdLocal(d),
      day: labelDay(d),
      workOrders: 0,
      revenue: 0,
      profit: 0,
    });
  }
  return out;
};

// eligibility
export const isCountableOrder = (o) => {
  const s = String(o?.paymentStatus || '').toLowerCase();
  if (SETTINGS.includePendingInRevenue)
    return ['paid', 'completed', 'partially_paid', 'pending'].includes(s);
  return ['paid', 'completed', 'partially_paid'].includes(s);
};

export const isCountableBill = (b) => {
  const s = String(b?.status || '').toLowerCase();
  if (SETTINGS.includePendingInRevenue)
    return ['paid', 'completed', 'partially_paid', 'pending'].includes(s);
  return ['paid', 'completed', 'partially_paid'].includes(s);
};

// per-line money (items only; tax ignored)
export const lineRevenue = (it) =>
  Math.max(N(it.quantity) * N(it.price) - N(it.refundAmount), 0);
export const lineCOGS = (it) => Math.max(N(it.quantity) * N(it.costPrice), 0);

// Build last-N-days series: workOrders from Orders; revenue/profit from Orders + Bills
export function buildSeriesFromOrdersAndBills(
  orders = [],
  bills = [],
  days = 14
) {
  const oList = Array.isArray(orders) ? orders : orders?.data || [];
  const bList = Array.isArray(bills) ? bills : bills?.data || [];
  const base = seedDays(days);
  const idx = Object.fromEntries(base.map((b, i) => [b.key, i]));

  // Orders
  for (const o of oList) {
    if (!o?.createdAt) continue;
    const d = new Date(o.createdAt);
    d.setHours(0, 0, 0, 0);
    const i = idx[ymdLocal(d)];
    if (i === undefined) continue;

    base[i].workOrders += 1;

    if (isCountableOrder(o)) {
      let rev = 0,
        cogs = 0;
      for (const it of o.items || []) {
        rev += lineRevenue(it);
        cogs += lineCOGS(it);
      }
      if (!o.items?.length && N(o.totalAmount)) rev += N(o.totalAmount); // rare fallback
      base[i].revenue += rev;
      base[i].profit += Math.max(rev - cogs, 0);
    }
  }

  // Bills (POS) — items only; ignore tax
  for (const b of bList) {
    if (!b?.createdAt) continue;
    const d = new Date(b.createdAt);
    d.setHours(0, 0, 0, 0);
    const i = idx[ymdLocal(d)];
    if (i === undefined) continue;

    if (isCountableBill(b)) {
      let rev = 0,
        cogs = 0;
      for (const it of b.items || []) {
        rev += lineRevenue(it);
        cogs += lineCOGS(it);
      }
      // net any aggregated refunds on the bill
      rev = Math.max(rev - N(b?.refundDetails?.totalRefundAmount), 0);

      base[i].revenue += rev;
      base[i].profit += Math.max(rev - cogs, 0);
    }
  }

  return base;
}

// Month-to-date totals from Orders + Bills (items only; ignore tax)
export function calcMTDFromOrdersAndBills(orders = [], bills = []) {
  const oList = Array.isArray(orders) ? orders : orders?.data || [];
  const bList = Array.isArray(bills) ? bills : bills?.data || [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  let revenue = 0,
    cogs = 0;

  for (const o of oList) {
    if (!o?.createdAt) continue;
    const d = new Date(o.createdAt);
    if (d < start || d > now) continue;
    if (!isCountableOrder(o)) continue;

    for (const it of o.items || []) {
      revenue += lineRevenue(it);
      cogs += lineCOGS(it);
    }
    if (!o.items?.length && N(o.totalAmount)) revenue += N(o.totalAmount);
  }

  for (const b of bList) {
    if (!b?.createdAt) continue;
    const d = new Date(b.createdAt);
    if (d < start || d > now) continue;
    if (!isCountableBill(b)) continue;

    for (const it of b.items || []) {
      revenue += lineRevenue(it);
      cogs += lineCOGS(it);
    }
    revenue -= N(b?.refundDetails?.totalRefundAmount);
  }

  revenue = Math.max(revenue, 0);
  return { revenue, profit: Math.max(revenue - cogs, 0) };
}

// Pie: revenue by variant from Orders + Bills (items only)
export function buildRevenuePieFromBoth(orders = [], bills = []) {
  const oList = Array.isArray(orders) ? orders : orders?.data || [];
  const bList = Array.isArray(bills) ? bills : bills?.data || [];
  const map = new Map();

  const add = (name, val) => {
    const key = name || 'Unknown';
    map.set(key, (map.get(key) || 0) + val);
  };

  for (const o of oList) {
    if (!isCountableOrder(o)) continue;
    for (const it of o.items || [])
      add(it.variantName || it.itemName || it.sku, lineRevenue(it));
  }
  for (const b of bList) {
    if (!isCountableBill(b)) continue;
    for (const it of b.items || [])
      add(it.variantName || it.itemName || it.sku, lineRevenue(it));
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}
