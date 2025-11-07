import { WAITERS } from './TablesBoard';


export function timeAgo(iso) {
  if (!iso) return '--';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m ago`;
}

export function fmtTime(iso) {
  if (!iso) return '--';
  const dt = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dt);
}
