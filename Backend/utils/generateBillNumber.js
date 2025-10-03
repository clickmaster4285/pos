import IndexModel from "../models/indexModel.js";

export const generateBillNumber = async (companyId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Fetch company
  const company = await IndexModel.Company.findOne({
    companyId: companyId,
    deleted: false,
    isActive: true,
  }).lean();

  if (!company) {
    throw new Error("Company not found or inactive");
  }

  const prefix = company?.invoiceSettings?.format?.prefix || "";
  const compId = company?.companyId || "";

  // Regex for last bill (prefix + companyId + date)
  const lastOrder = await IndexModel.Bill.findOne().sort({ createdAt: -1 }).lean();
  let sequence = company?.invoiceSettings?.format?.startNumber || 1;
  
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.billNumber.split("-").pop(), 10);
    console.log("Last Order:", lastSeq);
    sequence = lastSeq + 1;
  }

  const sequenceStr = String(sequence).padStart(4, "0");

  // Final Bill Number Format
  const billNumber = `${prefix}${compId}-${dateStr}-${sequenceStr}`;

  console.log("Generated Bill Number:", billNumber);
  return billNumber;
};
