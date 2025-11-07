// useScopedFields.js
'use client';
import { useMemo } from 'react';
import { getIndustryFields } from '@/utils/orderFields';

export default function useScopedFields(industry, mode /* 'order' | 'item' */) {
  const fields = useMemo(() => getIndustryFields(industry) || [], [industry]);

  const scopeMap = {
    restaurant: {
      order: ['tableNo', 'orderType', 'specialInstructions'],
      item: ['size', 'addons'],
    },
    fashion: {
      order: ['orderType'],
      item: ['brand', 'size', 'color'],
    },
    pharmacy: {
      order: ['doctorName', 'prescriptionRef', 'orderType'],
      item: ['batchNo', 'expiryDate'],
    },
  };

  const key = String(industry || '').toLowerCase();
  const allowed = scopeMap[key]?.[mode] || [];
  if (!allowed.length) return [];

  return fields.filter((f) => allowed.includes(f.name));
}
