// src/components/dashboard/metric-cards.jsx
import { Users, DollarSign, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCards({ data }) {
  const metrics = [
    {
      label: "Total Companies",
      value: data.totalCompanies || 0,
      icon: Users,
      color: "bg-primary/10 text-primary",
      trend: "+0.5%",
      trendPositive: true,
    },
    {
      label: "Total Revenue",
      value: `$${data.totalRevenue || 0} USD`,
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
      trend: "+120%",
      trendPositive: true,
    },
    {
      label: "Active Plans",
      value: data.totalActivePlan || 0,
      icon: Zap,
      color: "bg-primary/10 text-primary",
      trend: "100%",
      trendPositive: true,
    },
    {
      label: "Total Admins",
      value: data.totalAdmins || 0,
      icon: TrendingUp,
      color: "bg-primary/10 text-primary",
      trend: "+1",
      trendPositive: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="border-border bg-card hover:bg-muted/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{metric.value}</p>
                  <p className={`mt-2 text-xs font-medium ${metric.trendPositive ? "text-primary" : "text-destructive"}`}>
                    {metric.trend} vs last month
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}