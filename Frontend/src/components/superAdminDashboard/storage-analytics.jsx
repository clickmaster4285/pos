import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HardDrive } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function StorageAnalytics({ storage }) {
  const data = [
    { label: "Database", value: parseFloat(storage.mongoDataSizeMB) || 0, color: "bg-primary" },
    { label: "Uploads", value: parseFloat(storage.uploadsSizeMB) || 0, color: "bg-primary" },
    { label: "Total", value: parseFloat(storage.totalCombinedMB) || 0, color: "bg-primary", highlight: true },
  ];

  const chartData = [
    { week: "Week 1", database: 0.01, uploads: 0.02 },
    { week: "Week 2", database: 0.05, uploads: 0.04 },
    { week: "Week 3", database: 0.08, uploads: 0.06 },
    { week: "Week 4", database: 0.01, uploads: 0.08 },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Storage Analytics</CardTitle>
        <CardDescription>Database and upload storage usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
            <Line type="monotone" dataKey="database" stroke="var(--primary)" strokeWidth={2} />
            <Line type="monotone" dataKey="uploads" stroke="var(--primary)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid gap-3">
          {data.map((item, i) => (
            <div key={i}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <span className={`font-medium ${item.highlight ? "text-primary" : "text-foreground"}`}>
                  {item.value.toFixed(2)} MB
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.min((item.value / 1) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}