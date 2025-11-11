'use client';
// src/pages/superadmin/dashboard/page.jsx
import { useGetSuperAdminDashboardQuery } from '@/features/superAdminApi';
import { MetricCards } from "@/components/superAdminDashboard/metric-cards";
import { RevenueAnalytics } from "@/components/superAdminDashboard/revenue-analytics";
import { CompanyGrowth } from "@/components/superAdminDashboard/company-growth";
import { CompaniesTable } from "@/components/superAdminDashboard/companies-table";
import { ChurnRiskIndicators } from "@/components/superAdminDashboard/churn-risk-indicators";
import { StorageAnalytics } from "@/components/superAdminDashboard/storage-analytics";
import { PaymentStatusBreakdown } from "@/components/superAdminDashboard/payment-status-breakdown";
import { FeatureUsageStats } from "@/components/superAdminDashboard/feature-usage-stats";

export default function Page() {
  const { data, isLoading, error } = useGetSuperAdminDashboardQuery();

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Error loading dashboard</div>;

  const dashboardData = data?.data || {};

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enterprise-level system monitoring and analytics</p>
      </header>

      <div className="space-y-6 p-6">
        <MetricCards data={dashboardData} />
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueAnalytics data={dashboardData.revenueActivity} />
          <CompanyGrowth data={dashboardData} />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CompaniesTable companies={dashboardData.recentCompanies || []} />
          </div>
          <ChurnRiskIndicators companies={dashboardData.recentCompanies || []} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <StorageAnalytics storage={dashboardData.storage || {}} />
          <div className="grid gap-6">
            <PaymentStatusBreakdown active={dashboardData.activeCompanies} total={dashboardData.totalCompanies} />
            <FeatureUsageStats companies={dashboardData.recentCompanies || []} />
          </div>
        </div>
      </div>
    </main>
  );
}