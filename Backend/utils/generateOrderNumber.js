import IndexModel from '../models/indexModel.js';

/**
 * Generates a unique order number per company per day.
 * Format: COMPANYID-YYYYMMDD-0001
 */
export const generateOrderNumber = async (companyId, retry = 3) => {
  if (!companyId)
    throw new Error('companyId is required for order number generation');

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const prefix = `${companyId}-${dateStr}-`;

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapeRegExp(prefix)}`);

  const lastOrder = await IndexModel.Orders.findOne({ orderNo: regex })
    .sort({ orderNo: -1 })
    .select('orderNo')
    .lean();

  let sequence = 1;
  if (lastOrder?.orderNo) {
    const parts = lastOrder.orderNo.split('-');
    const lastSeq = parseInt(parts.at(-1), 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  const orderNo = `${prefix}${String(sequence).padStart(4, '0')}`;

  // Quick duplicate check in case of race condition
  const exists = await IndexModel.Orders.exists({ orderNo });
  if (exists && retry > 0) {
    console.warn('⚠️ Duplicate orderNo detected, retrying...');
    return generateOrderNumber(companyId, retry - 1);
  }

  return orderNo;
};
