import mongoose from 'mongoose';
import IndexModel from '../models/indexModel.js';

// Generate a unique sourceId (e.g., PO-12345, AUDIT-001)
export const generateUniqueSourceId = async (type, companyId) => {
  const prefix = type?.toUpperCase()?.slice(0, 6); // e.g., PURCHASE -> PUR, AUDIT -> AUD
  const count = await IndexModel.History.countDocuments({ companyId, source: new RegExp(`^${prefix}-`) });
  const sourceId = `${prefix}-${companyId}-${(count + 1).toString().padStart(5, '0')}`;
  
  // Verify uniqueness
  const existing = await IndexModel.History.findOne({ source: sourceId, companyId });
  if (existing) {
    throw new Error(`Source ID ${sourceId} already exists`);
  }
  return sourceId;
};