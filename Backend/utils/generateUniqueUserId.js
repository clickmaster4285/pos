// utils/generateUserId.js
import IndexModel from '../models/indexModel.js';

// Step 1: Generate base userId from name
function createRawUserId(name = '') {
  const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePart = (cleaned.slice(0, 3) + 'XXX').slice(0, 3); // always 3 letters

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const suffix = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');

  return namePart + suffix; // 8 characters total
}

// Step 2: Generate unique userId by checking DB
export async function generateUniqueUserId(name) {
  let attempt = 0;
  let userId;
  let exists = true;

  while (exists && attempt < 10) {
    userId = createRawUserId(name);
    exists = await IndexModel.User.exists({ userId }); // Check DB
    attempt++;
  }

  if (exists) {
    throw new Error('Could not generate a unique userId after 10 attempts');
  }

  return userId;
}
