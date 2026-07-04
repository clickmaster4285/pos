import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, TrendingDown } from "lucide-react";

export function ChurnRiskIndicators({ companies }) {
  const atRisk = companies.filter(c => {
    const plan = c.plan?.[0];
    return plan && plan.validateDays <= 30 && plan.status !== "active";
  });

  const getSeverityColor = (days) => {
    if (days <= 7) return "bg-destructive/10 border-destructive/30 text-destructive";
    if (days <= 14) return "bg-primary/10 border-primary/30 text-primary";
    return "bg-muted/10 border-muted/30 text-muted-foreground";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Churn Risk Indicators</CardTitle>
        <CardDescription>{atRisk.length} company at risk</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {atRisk.length > 0 ? (
            atRisk.map((company) => {
              const plan = company.plan[0];
              return (
                <div key={company._id} className={`border rounded-lg p-4 ${getSeverityColor(plan.validateDays)}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm mt-1">Expires Soon</p>
                      <div className="mt-2 text-xs space-y-1">
                        <p>Expires in: <span className="font-semibold">{plan.validateDays} days</span></p>
                        <p>Utilization: <span className="font-semibold">Low</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <TrendingDown className="h-5 w-5 mr-2" />
              <span>All companies are healthy</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}