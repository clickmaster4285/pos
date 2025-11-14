// src/components/dashboard/companies-table.jsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

export function CompaniesTable({ companies }) {
  const [expandedId, setExpandedId] = useState(null);
  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-primary/10 text-primary";
      case "pending": return "bg-muted/10 text-muted-foreground";
      case "suspended": return "bg-destructive/10 text-destructive";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  const getExpiryColor = (days) => {
    if (days <= 7) return "text-destructive";
    if (days <= 14) return "text-primary";
    return "text-primary";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Active Companies</CardTitle>
        <CardDescription>Manage and monitor your enterprise clients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {companies.map((company) => {
            const plan = company.plan?.find(p => p.isActive === true) || {};
            const daysLeft = plan.validateDays || 0;
            const staffUsed =  company.gain.staff.length ||0;//
            const staffLimit = plan.limitations?.maxStaff || 0;

            return (
              <div key={company._id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === company._id ? null : company._id)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.name || "Unknown"} Plan • ${plan.price || 0}/{plan.currencyCode || "USD"}
                      </p>
                    </div>
                    <Badge className={getStatusColor(plan.status || "pending")}>
                      {plan.status?.charAt(0).toUpperCase() + plan.status?.slice(1) || "Pending"}
                    </Badge>
                    <div className={`text-sm font-medium ${getExpiryColor(daysLeft)}`}>
                      {daysLeft}d
                    </div>
                  </div>
                  {expandedId === company._id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {expandedId === company._id && (
                  <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Staff Utilization</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {staffUsed}/{staffLimit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Expiry</p>
                        <p className={`mt-1 text-lg font-semibold ${getExpiryColor(daysLeft)}`}>
                          {daysLeft} days
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Features</p>
                      <div className="flex flex-wrap gap-2">
                        {(plan.limitations?.features || []).slice(0, 5).map((f, i) => (
                          <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
                            {f}
                          </Badge>
                        ))}
                        {plan.limitations?.features?.length > 5 && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            +{plan.limitations.features.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}