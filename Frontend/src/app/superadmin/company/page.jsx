// src/app/companies/page.jsx
'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Clock, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CompanyGrid } from '@/components/company/CompanyGrid';
import { CompanyList } from '@/components/company/CompanyList';
import { UnverifiedCompanies } from '@/components/company/UnverifiedCompanies';
import { CompanyDetailsSheet } from '@/components/company/CompanyDetailsSheet';
import {
  useGetAllCompaniesQuery,
  useToggleCompanyStatusMutation,
  useVerifyCompanyAdminMutation,
} from '@/features/CompanyApi';

function mapCompany(c) {
  return {
    id: String(c._id || c.id || c.companyId),
    name: c.name || '—',
    industry: c.industryName || '—',
    status: c.isActive ? 'Active' : 'Inactive',
    isActive: c.isActive,
    contactEmail: c.contactEmail || '—',
    contactPhone: c.contactPhone || '—',
    address: c.address || '—',
    plan: c.plan || [],
    gain: c.gain || { staff: [], vendor: 0, product: 0 },
    usersCount: Array.isArray(c?.gain?.staff)
      ? c.gain.staff.length
      : typeof c.usersCount === 'number'
      ? c.usersCount
      : 0,
    createdAt: c.createdAt || new Date().toISOString(),
    ownerDetails: c.ownerDetails || {},
    invoiceSettings: c.invoiceSettings || {},
    subscription: c.subscription || [],
  };
}

const dateFilterOptions = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
];

export default function CompaniesPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showUnverified, setShowUnverified] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pageSize = 10;

  const {
    data: companies = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllCompaniesQuery();

  const [toggleStatus, { isLoading: isToggling }] = useToggleCompanyStatusMutation();
  const [verifyCompany, { isLoading: isVerifying }] = useVerifyCompanyAdminMutation();
  const [pendingId, setPendingId] = useState(null);

  const { verifiedCompanies, unverifiedCompanies } = useMemo(() => {
    const mapped = Array.isArray(companies.data) && companies.data.length
      ? companies.data.map(mapCompany)
      : [];

    return {
      verifiedCompanies: mapped.filter(c => c.isActive),
      unverifiedCompanies: mapped.filter(c => !c.isActive),
    };
  }, [companies]);

  const dataToUse = showUnverified ? unverifiedCompanies : verifiedCompanies;

  const filtered = useMemo(() => {
    let result = dataToUse;
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((c) =>
        [c.name, c.industry, c.status].some((v) =>
          String(v).toLowerCase().includes(q)
        )
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status.toLowerCase() === statusFilter);
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

      result = result.filter((c) => {
        const createdDate = new Date(c.createdAt);
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
  }, [dataToUse, query, statusFilter, dateFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const start = (page - 1) * pageSize;
  const current = filtered.slice(start, start + pageSize);

  const handleVerify = async (id, action) => {
    try {
      await verifyCompany({ id, action }).unwrap();
      refetch();
    } catch (e) {
      console.error('Verification error:', e);
    }
  };

  const openCompanyDetail = (company) => {
    setSelectedCompany(company);
    setSheetOpen(true);
  };

  const handleToggle = async (company) => {
    try {
      setPendingId(company.id);
      await toggleStatus(company.id).unwrap();
      if (selectedCompany?.id === company.id) {
        setSelectedCompany({ ...selectedCompany, isActive: !company.isActive });
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
          <div className="text-destructive font-semibold mb-2">
            Failed to load...
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Companies Management
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {showUnverified
                ? `Manage unverified company applications (${unverifiedCompanies.length} pending)`
                : 'End-to-end company management for superadmins'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={showUnverified ? "default" : "outline"}
              onClick={() => {
                setShowUnverified(!showUnverified);
                setPage(1);
              }}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {showUnverified ? 'Verified Companies' : 'Unverified Companies'}
              {unverifiedCompanies.length > 0 && !showUnverified && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
                  {unverifiedCompanies.length}
                </span>
              )}
            </Button>

            <div className="flex items-center border rounded-lg">
              <Button
                variant={view === 'grid' ? "default" : "ghost"}
                size="sm"
                onClick={() => setView('grid')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => setView('list')}
                className="rounded-l-none border-l"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full h-11 pl-10 pr-4 rounded-lg border bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
                placeholder="Search by name, industry, status..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                className="h-11 px-3 rounded-lg border bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                className="h-11 px-3 rounded-lg border bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
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
        </div>

        {/* Content */}
        <div>
          {showUnverified ? (
            <UnverifiedCompanies
              unverifiedCompanie={unverifiedCompanies}
              onDetail={openCompanyDetail}
              handleVerify={handleVerify}
              isVerifying={isVerifying}
            />
          ) : view === 'grid' ? (
            <CompanyGrid
              items={current}
              handleToggle={handleToggle}
              handleVerify={handleVerify}
              pendingId={pendingId}
              showUnverified={showUnverified}
              isVerifying={isVerifying}
              onDetail={openCompanyDetail}
            />
          ) : (
            <CompanyList
              items={current}
              handleToggle={handleToggle}
              handleVerify={handleVerify}
              pendingId={pendingId}
              showUnverified={showUnverified}
              isVerifying={isVerifying}
              onDetail={openCompanyDetail}
            />
          )}

          {/* Pagination */}
          {total > 0 && !showUnverified && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {start + 1}-{Math.min(start + pageSize, total)} of {total} companies
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const pageNumber = windowStart + i;
                    if (pageNumber > totalPages) return null;

                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Company Details Sheet */}
        <CompanyDetailsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          company={selectedCompany}
          onEdit={(c) => {
            console.log('Edit company:', c);
          }}
          onDelete={(c) => {
            console.log('Delete company:', c);
          }}
          onToggle={handleToggle}
          pending={pendingId === selectedCompany?.id}
        />
      </div>
    </main>
  );
} 