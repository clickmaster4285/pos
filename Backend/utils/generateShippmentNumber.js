import IndexModel from '../models/indexModel.js';

export const generateAwbNumber = async (companyId) => {
  if (!companyId) {
    throw new Error('companyId is required to generate AWB');
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // IMPORTANT: we rely on a fixed AWB format to search with regex.
  // Format: COMPANY-YYYYMMDD-####
  const prefix = `${companyId}-${dateStr}-`;

  // Find the last awb for this company on this date
  // NOTE: String sort works because the sequence is zero-padded to 4 digits.
  const lastShipment = await IndexModel.Shipment.findOne({
    companyId,
    awb: { $regex: `^${prefix}` },
  })
    .sort({ awb: -1 }) // highest seq last
    .select('awb')
    .lean();

  let sequence = 1;
  if (lastShipment?.awb) {
    const parts = lastShipment.awb.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (Number.isFinite(lastSeq)) sequence = lastSeq + 1;
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  return `${prefix}${sequenceStr}`;
};
