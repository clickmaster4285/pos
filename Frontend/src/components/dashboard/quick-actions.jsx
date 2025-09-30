import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  Users,
  Settings,
  BarChart3,
  Wrench,
} from 'lucide-react';

const actions = [
  {
    title: 'Add Vehicle',
    description: 'Register new vehicle',
    icon: Plus,
    color: 'bg-chart-1 text-white',
  },
  {
    title: 'Generate Report',
    description: 'Fleet analytics',
    icon: FileText,
    color: 'bg-chart-2 text-white',
  },
  {
    title: 'Manage Dealers',
    description: 'Partner network',
    icon: Users,
    color: 'bg-chart-3 text-white',
  },
  {
    title: 'System Config',
    description: 'Platform settings',
    icon: Settings,
    color: 'bg-chart-4 text-white',
  },
  {
    title: 'Analytics',
    description: 'Performance metrics',
    icon: BarChart3,
    color: 'bg-chart-5 text-white',
  },
  {
    title: 'Maintenance',
    description: 'Service scheduling',
    icon: Wrench,
    color: 'bg-success text-white',
  },
];

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.title}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/70"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">
                    {action.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
