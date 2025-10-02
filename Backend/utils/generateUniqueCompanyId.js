// utils/generateUniqueCompanyId.js
import IndexModel from '../models/indexModel.js';

// Step 1: Generate base companyId from name
function createRawCompanyId(name = '') {
  const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePart = (cleaned.slice(0, 3) + 'XXX').slice(0, 3); // always 3 letters

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const suffix = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');

  return namePart + suffix; // 8 characters total
}

// Step 2: Generate unique companyId by checking DB
export async function generateUniqueCompanyId(name) {
  let attempt = 0;
  let companyId;
  let exists = true;

  while (exists && attempt < 10) {
    companyId = createRawCompanyId(name);
    exists = await IndexModel.Company.exists({ companyId }); // Check DB
    attempt++;
  }

  if (exists) {
    throw new Error('Could not generate a unique companyId after 10 attempts');
  }

  return companyId;
}