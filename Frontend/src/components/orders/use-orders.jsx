'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

// ---- Mock seed data -------------------------------------------------
const SEED = Array.from({ length: 37 }).map((_, i) => {
  const id = crypto.randomUUID();
  const statuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  const status = statuses[i % statuses.length];
  const totals = [120, 250, 80.5, 430.25, 999.99];
  return {
    id,
    customerName: [
      'Ali Khan',
      'Sara Ahmed',
      'John Doe',
      'Zara Malik',
      'Bilal Aslam',
    ][i % 5],
    vehicleModel: [
      'Toyota Corolla',
      'Honda Civic',
      'Kia Sportage',
      'Suzuki Swift',
    ][i % 4],
    status,
    total: totals[i % totals.length],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

// --------------------------------------------------------------------
// In-memory store lives for the session (per tab). No API calls.
export function useOrders(page, pageSize) {
  // One shared ref to hold the "DB"
  const storeRef = useRef([...SEED]);
  const [version, setVersion] = useState(0); // bump to force recompute
  const [deleting, setDeleting] = useState(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const isLoading = false;
  const error = null;

  // Paging
  const total = storeRef.current.length;
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);

  const orders = useMemo(
    () => storeRef.current.slice(start, end),
    // include "version" so UI updates after mutations
    [start, end, version]
  );

  // CRUD (mocked)
  const create = useCallback(async (payload) => {
    // mimic small latency
    await new Promise((r) => setTimeout(r, 200));
    const doc = {
      id: crypto.randomUUID(),
      customerName: payload.customerName.trim(),
      vehicleModel: payload.vehicleModel.trim(),
      status: payload.status || 'Pending',
      total: Number(payload.total || 0),
      createdAt: new Date().toISOString(),
    };
    storeRef.current = [doc, ...storeRef.current];
    setVersion((v) => v + 1);
    return { data: doc };
  }, []);

  const update = useCallback(async (id, patch) => {
    await new Promise((r) => setTimeout(r, 200));
    storeRef.current = storeRef.current.map((o) =>
      o.id === id ? { ...o, ...patch } : o
    );
    setVersion((v) => v + 1);
    const updated = storeRef.current.find((o) => o.id === id);
    return { data: updated };
  }, []);

  const remove = useCallback(async (id) => {
    setDeleting((s) => new Set(s).add(id));
    try {
      await new Promise((r) => setTimeout(r, 200));
      storeRef.current = storeRef.current.filter((o) => o.id !== id);
      setVersion((v) => v + 1);
    } finally {
      setDeleting((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    // nothing to fetch, but we keep the API
    setIsValidating(true);
    await new Promise((r) => setTimeout(r, 100));
    setIsValidating(false);
  }, []);

  return {
    orders,
    page,
    pageSize,
    total,
    isLoading,
    isValidating,
    error,
    create,
    update,
    remove,
    deleting,
    refresh,
  };
}
