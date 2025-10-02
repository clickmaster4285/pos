import IndexModel from "../models/indexModel.js";

export const generateBillNumber = async (companyId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Find the last order number for this company and date
  const lastOrder = await IndexModel.Bill.findOne({
    billNumber: { $regex: `^${companyId}-${dateStr}-` },
  })
    .sort({ billNumber: -1 })
    .select('billNumber');

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.billNumber.split('-')[2]);
    sequence = lastSeq + 1;
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  console.log("the bill number is : ", `${companyId}-${dateStr}-${sequenceStr}`);
  return `${companyId}-${dateStr}-${sequenceStr}`;
};