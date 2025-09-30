import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Fleet',
    value: '12,847',
    change: '+2.5%',
    trend: 'up',
    icon: Car,
    description: 'Active vehicles',
    colour: 'text-chart-1',
  },
  {
    title: 'Dealerships',
    value: '284',
    change: '+12',
    trend: 'up',
    icon: Users,
    description: 'Network partners',
    colour: 'text-chart-2',
  },
  {
    title: 'Monthly Revenue',
    value: '$2.4M',
    change: '+8.2%',
    trend: 'up',
    icon: DollarSign,
    description: 'This month',
    colour: 'text-chart-3',
  },
  {
    title: 'Service Alerts',
    value: '47',
    change: '-15%',
    trend: 'down',
    icon: AlertTriangle,
    description: 'Pending issues',
    colour: 'text-chart-4',
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isPositive = stat.trend === 'up';

        return (
          <Card
            key={stat.title}
            className="bg-card border-border hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.colour}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 text-sm ${
                    isPositive ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
