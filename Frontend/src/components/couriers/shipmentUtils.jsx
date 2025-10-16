// shipmentUtils.ts

export function mapRawStatusToNormalized(raw) {
  const s = String(raw || '')
    .toLowerCase()
    .trim();

  // broaden matches
  if (s.includes('cancel')) return 'CANCELLED';
  if (s.includes('return')) return 'RETURNED';

  // common OFD variants
  if (
    s.includes('out for delivery') ||
    s.includes('out-for-delivery') ||
    s.includes('out_for_delivery') ||
    s.includes('with rider') ||
    s.includes('ofd')
  ) {
    return 'OUT_FOR_DELIVERY';
  }

  // delivered variants
  if (s.includes('delivered') || s.includes('dlvd') || s.includes('deliverd')) {
    return 'DELIVERED';
  }

  if (s.includes('in transit') || s.includes('depart') || s.includes('sort')) {
    return 'IN_TRANSIT';
  }

  if (s.includes('created') || s.includes('pending') || s.includes('await')) {
    return 'PENDING';
  }

  return 'IN_TRANSIT';
}

export function nextStatusesFor(current) {
  switch (current) {
    case 'PENDING':
      // allow promoting straight to IN_TRANSIT or cancel
      return ['IN_TRANSIT', 'CANCELLED'];
    case 'IN_TRANSIT':
      // add DELIVERED here so it appears in the menu
      return ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'];
    case 'OUT_FOR_DELIVERY':
      return ['DELIVERED', 'RETURNED'];
    default:
      return [];
  }
}

// helper for updates: convert normalized -> raw string your backend will parse
export function normalizedToRaw(n) {
  switch (n) {
    case 'PENDING':
      return 'pending';
    case 'IN_TRANSIT':
      return 'in transit';
    case 'OUT_FOR_DELIVERY':
      return 'out for delivery';
    case 'DELIVERED':
      return 'delivered';
    case 'RETURNED':
      return 'returned';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return String(n || '');
  }
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}
