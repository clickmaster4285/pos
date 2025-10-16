// lib/crypto.js
import crypto from 'crypto';

const ENC_ALGO = 'aes-256-gcm';
const RAW_KEY = process.env.ENCRYPTION_KEY; // 32 bytes (hex or base64)
if (!RAW_KEY) throw new Error('SECRETS_KEY missing');
const KEY = Buffer.from(RAW_KEY, RAW_KEY.length === 64 ? 'hex' : 'base64');

export function encryptSecret(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, KEY, iv);
  const enc = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64'); // iv|tag|enc
}

export function decryptSecret(blob) {
  if (!blob) return null;
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ENC_ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

// lib/credentialsMask.js
export function maskCredentials(creds) {
  if (!creds) return null;
  const has = (v) => (v ? '********' : null);
  return {
    baseUrl: creds.baseUrl ?? null,
    username: creds.username ? '••••••' : null,
    clientId: creds.clientId ? '••••••' : null,
    password: has(creds.password),
    clientSecret: has(creds.clientSecret),
    apiKey: has(creds.apiKey),
    scope: creds.scope ?? null,
    environment: creds.environment ?? null,
    updatedAt: creds.updatedAt ?? null,
    setBy: creds.setBy ?? null,
  };
}

//-------------

export async function pingCourier(courier) {
  try {
    // Optional: pick a real test URL if the courier has one
    const url = courier?.credentials?.baseUrl;
    if (!url) return { ok: false, message: 'Missing baseUrl in credentials' };

    // try a simple GET or /ping endpoint
    const res = await fetch(url, { method: 'GET', timeout: 5000 });
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };

    return { ok: true, message: 'Ping successful' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}
