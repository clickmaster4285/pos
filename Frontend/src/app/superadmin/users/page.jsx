'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { UserGrid } from './UserGrid';
import { UserList } from './UserList';
import { useGetAllCustomerUsersQuery, useToggleUserStatusMutation } from '@/features/userApi';

function mapUser(u) {
  return {
    id: String(u._id || u.userId),
    name: u.name || '—',
    email: u.email || '—',
    phone: u.phone || '—',
    address: u.address || '—',
    role: u.role || '—',
    status: u.isActive ? 'Active' : 'Inactive',
    isActive: u.isActive,
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

const dateFilterOptions = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
];

export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: users = [], isLoading, isError, error } = useGetAllCustomerUsersQuery();
  const [toggleStatus, { isLoading: isToggling }] = useToggleUserStatusMutation();
  const [pendingId, setPendingId] = useState(null);

  const handleToggle = async (user) => {
    try {
      setPendingId(user.id);
      await toggleStatus(user.id).unwrap();
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    } finally {
      setPendingId(null);
    }
  };

  useEffect(() => {
    if (Array.isArray(users) && users.length) {
      setItems(users.map(mapUser));
    } else {
      setItems([]);
    }
  }, [users]);

  const filtered = useMemo(() => {
    let result = items;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((u) =>
        [u.name, u.email, u.role, u.status].some((v) =>
          String(v).toLowerCase().includes(q)
        )
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((u) => u.status.toLowerCase() === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last7':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last30':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          break;
      }

      result = result.filter((u) => {
        const createdDate = new Date(u.createdAt);
        switch (dateFilter) {
          case 'today':
            return createdDate >= startDate;
          case 'yesterday':
            const yesterdayStart = new Date(now);
            yesterdayStart.setDate(now.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23, 59, 59, 999);
            return createdDate >= yesterdayStart && createdDate <= yesterdayEnd;
          case 'last7':
          case 'last30':
            return createdDate >= startDate;
          default:
            return true;
        }
      });
    }

    return result;
  }, [items, query, statusFilter, dateFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const start = (page - 1) * pageSize;
  const current = filtered.slice(start, start + pageSize);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading users…</div>;
  }
  if (isError) {
    return (
      <div className="p-6 text-sm ">
        Failed to load users{error?.data?.error ? `: ${error.data.error}` : ''}.
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-full p-6">
      <div className="flex justify-between">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mt-3">Users Management</h1>
          <p className="text-sm text-muted-foreground">
            End-to-end user management for superadmins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 w-full">
          <input
            className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring min-w-0"
            placeholder="Search by name, email, role, status"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {dateFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        {view === 'grid' ? (
          <UserGrid items={current} handleToggle={handleToggle} pendingId={pendingId} />
        ) : (
          <UserList items={current} handleToggle={handleToggle} pendingId={pendingId} />
        )}

        <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {total === 0 ? 0 : start + 1}-
            {Math.min(start + pageSize, total)} of {total}
          </p>
          <nav className="flex items-center gap-1" aria-label="Pagination">
            <button
              className="h-8 rounded-md border bg-secondary px-2 text-xs text-secondary-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNumber = windowStart + i;
              if (pageNumber > totalPages) return null;
              const active = pageNumber === page;
              return (
                <button
                  key={pageNumber}
                  className={`h-8 w-8 rounded-md text-xs ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'border bg-background text-foreground'
                  }`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              className="h-8 rounded-md border bg-secondary px-2 text-xs text-secondary-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </main>
  );
}