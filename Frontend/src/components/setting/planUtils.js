// utils/planUtils.js
export const pickCurrentCompanyPlan = (companyPlanArr = []) => {
  if (!Array.isArray(companyPlanArr) || companyPlanArr.length === 0)
    return null;

  // Prefer an active plan; otherwise take the most recent one
  const active = companyPlanArr.find((p) => p.isActive);
  if (active) return active;

  return [...companyPlanArr].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )[0];
};

export const computeNextRenewal = (planItem) => {
  if (!planItem) return '—';
  const days = Number(planItem.validateDays) || 0;
  if (!days) return '—';
  if (!planItem.createdAt) return '—';

  const start = new Date(planItem.createdAt);
  const renewal = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return renewal.toLocaleDateString();
};

// Convert backend items into a flat list for the picker (if you enable it later)
export const normalizePlansForPicker = (companyPlanArr = []) =>
  companyPlanArr.map((p) => ({
    id: p._id, // keep the mongo id
    label: p.name, // display name
    price: p.price, // number
    period: '/mo', // you can adjust if you track billing cycle
    tag: p.status || (p.isActive ? 'active' : '—'),
    features: Array.isArray(p?.limitations?.features)
      ? p.limitations.features
      : [],
    validateDays: p.validateDays,
    description: p.description || '',
    raw: p, // keep the original for anything else
  }));
