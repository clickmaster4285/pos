import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function CompanyGrowth({ data }) {
  const growth = [
    { month: "Jan", companies: 1 },
    { month: "Feb", companies: 1 },
    { month: "Mar", companies: 1 },
    { month: "Apr", companies: 1 },
    { month: "May", companies: 1 },
    { month: "Jun", companies: data.totalCompanies || 2 },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Company Growth</CardTitle>
        <CardDescription>Growth rate: +100% (1 new company)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
            <Bar dataKey="companies" fill="var(--primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}