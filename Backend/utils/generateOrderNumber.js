import IndexModel from "../models/indexModel.js";

// Generate unique order number with format: COMPANYID-YYYYMMDD-SEQ
export const generateOrderNumber = async (companyId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Find the last order number for this company and date
  const lastOrder = await IndexModel.Order.findOne({
    orderNumber: { $regex: `^${companyId}-${dateStr}-` }
  })
    .sort({ orderNumber: -1 })
    .select('orderNumber');

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2]);
    sequence = lastSeq + 1;
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  return `${companyId}-${dateStr}-${sequenceStr}`;
};