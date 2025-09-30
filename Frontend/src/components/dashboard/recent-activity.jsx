import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Car, User, AlertTriangle } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'vehicle',
    title: 'New vehicle registered',
    description: 'Tesla Model Y - FL-105',
    time: '2 hours ago',
    icon: Car,
    status: 'success',
  },
  {
    id: 2,
    type: 'user',
    title: 'Dealer account created',
    description: 'Premium Motors LLC',
    time: '4 hours ago',
    icon: User,
    status: 'info',
  },
  {
    id: 3,
    type: 'alert',
    title: 'Service alert triggered',
    description: 'BMW X5 - FL-002',
    time: '6 hours ago',
    icon: AlertTriangle,
    status: 'warning',
  },
  {
    id: 4,
    type: 'vehicle',
    title: 'Fleet inspection completed',
    description: '15 vehicles processed',
    time: '1 day ago',
    icon: Car,
    status: 'success',
  },
];

export function RecentActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.status === 'success'
                      ? 'bg-chart-5/10 text-chart-5'
                      : activity.status === 'warning'
                      ? 'bg-chart-3/10 text-chart-3'
                      : 'bg-chart-4/10 text-chart-4'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
