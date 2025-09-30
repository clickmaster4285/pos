'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Eye,
  Settings,
} from 'lucide-react';

const planStats = [
  {
    plan: 'Enterprise Fleet',
    subscribers: 24,
    revenue: '$59,976',
    growth: '+12%',
    color: 'text-chart-4',
  },
  {
    plan: 'Premium Fleet',
    subscribers: 67,
    revenue: '$87,033',
    growth: '+8%',
    color: 'text-chart-5',
  },
  {
    plan: 'Professional',
    subscribers: 156,
    revenue: '$140,244',
    growth: '+15%',
    color: 'text-chart-3',
  },
  {
    plan: 'Basic',
    subscribers: 342,
    revenue: '$68,400',
    growth: '+5%',
    color: 'text-chart-2',
  },
];

const recentPurchases = [
  {
    customer: 'Fleet Dynamics Inc.',
    plan: 'Enterprise Fleet',
    amount: '$2,499',
    time: '2 hours ago',
    status: 'verified',
  },
  {
    customer: 'Urban Transport',
    plan: 'Premium Fleet',
    amount: '$1,299',
    time: '4 hours ago',
    status: 'verified',
  },
  {
    customer: 'Logistics Pro',
    plan: 'Professional',
    amount: '$899',
    time: '6 hours ago',
    status: 'pending',
  },
];

export function PlanManagement() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Package className="h-5 w-5 text-chart-3" />
          Plan Management Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Statistics */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Active Subscriptions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {planStats.map((stat) => (
              <div
                key={stat.plan}
                className="border border-border/30 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {stat.plan}
                  </span>
                  <Badge variant="outline" className={stat.color}>
                    {stat.growth}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {stat.subscribers}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {stat.revenue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Recent Purchases</h3>
          <div className="space-y-2">
            {recentPurchases.map((purchase, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border border-border/20 rounded"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {purchase.customer}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {purchase.plan} • {purchase.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {purchase.amount}
                  </span>
                  <Badge
                    variant={
                      purchase.status === 'verified' ? 'default' : 'pending'
                    }
                    className={
                      purchase.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ''
                    }
                  >
                    {purchase.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Eye className="h-4 w-4 mr-1" />
            View All Plans
          </Button>
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Settings className="h-4 w-4 mr-1" />
            Manage Pricing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
