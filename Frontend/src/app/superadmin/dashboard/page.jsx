import { Header } from '@/components/dashboard/header';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { VehicleFleetOverview } from '@/components/dashboard/vehicle-fleet-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { PlanManagement } from '@/components/dashboard/plan-management';
import { PendingVerifications } from '@/components/dashboard/pending-verifications';

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <main className="contaeeiner mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
            Automotive Dashboard
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Comprehensive oversight and management of your automotive operations
            ecosystem
          </p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Plan Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <PendingVerifications />
          <PlanManagement />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Fleet Overview - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <VehicleFleetOverview />
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
