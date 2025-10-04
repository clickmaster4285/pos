'use client';

export const getUserId = (u) => u?._id || u?.id;

export const isUserActive = (u) =>
  u?.isActive === true ||
  u?.isActive === 'true' ||
  u?.status?.isaccepted === true ||
  u?.status?.isaccepted === 'true';

export const humanize = (key = '') =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (m) => m.toUpperCase())
    .trim();

export const countActivePermissions = (permissions = {}) =>
  Object.values(permissions).filter(Boolean).length;

export const normalizeAction = (raw = '') => {
  const s = String(raw).toLowerCase();
  if (s.includes('permission')) return 'permission_changed';
  if (s.includes('created')) return 'created';
  if (s.includes('deleted') || s.includes('removed')) return 'deleted';
  if (s.includes('updated') || s.includes('edit')) return 'updated';
  return 'updated';
};
