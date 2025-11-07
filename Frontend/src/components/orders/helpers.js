// helpers.js
export const toId = (x) => (x == null ? '' : String(x));

export function currency(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(n) ? n : 0);
}

export function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [
      {
        productId: '',
        name: '',
        qty: 1,
        price: 0,
        total: 0,
        dynamicAttributes: {},
      },
    ];
  }
  return items.map((it) => ({
    productId: String(it?.productId || it?.productItem || ''),
    name: it?.name || it?.itemName || '',
    qty: Number(it?.qty ?? it?.quantity ?? 1),
    price: Number(it?.price ?? 0),
    total:
      Number(it?.total ?? 0) ||
      Number(it?.price ?? 0) * Number(it?.qty ?? it?.quantity ?? 1),
    dynamicAttributes: it?.dynamicAttributes || {},
  }));
}
