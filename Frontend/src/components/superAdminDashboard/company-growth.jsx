import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

export function CompanyGrowth({ data }) {

  // Initialize months
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Count companies per month
  const monthlyGrowth = months.map((month, index) => {
    const count = data.companyGrowth.filter(item => {
      const date = parseISO(item.createdAt);
      return date.getMonth() === index;
    }).length;
    return { month, companies: count };
  });

  // Optional: calculate total growth for description
  const totalCompanies = data.companyGrowth.length;
  const newCompanies = totalCompanies; // Or calculate difference if you want a % growth

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Company Growth</CardTitle>
        <CardDescription>Growth rate: +{newCompanies} company(ies)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyGrowth}>
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
