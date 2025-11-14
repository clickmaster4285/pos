import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function FeatureUsageStats({ companies }) {
  const featureCount = {};
  companies.forEach(c => {
    const features = c.plan?.[0]?.limitations?.features || [];
    features.forEach(f => {
      featureCount[f] = (featureCount[f] || 0) + 1;
    });
  });

  const features = Object.entries(featureCount)
    .map(([name, count]) => ({
      name,
      usage: Math.round((count / companies.length) * 100),
      companies: count,
    }))
    .sort((a, b) => b.companies - a.companies)
    .slice(0, 5);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Feature Usage Statistics</CardTitle>
        <CardDescription>Most commonly enabled features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((f, i) => (
            <div key={i}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{f.name}</span>
                <span className="font-medium text-foreground">{f.usage}% ({f.companies})</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${f.usage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}