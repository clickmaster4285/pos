import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

export function RevenueAnalytics({ data }) {
  const revenueActivity = data || [];
  
  // Calculate total revenue from the data array
  const totalRevenue = useMemo(() => 
    revenueActivity.reduce((sum, item) => sum + (item.price || 0), 0), 
    [revenueActivity]
  );

  // State for period navigation
  const [periodType, setPeriodType] = useState("month"); // week, month, year
  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper: Group plans by period (week, month, year)
  const getPeriodKey = (date, type) => {
    const d = new Date(date);
    if (type === "week") {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      return start.toISOString().split("T")[0];
    }
    if (type === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (type === "year") return d.getFullYear().toString();
    return "";
  };

  // Generate period labels
  const generatePeriods = (type) => {
    const periods = [];
    const now = new Date();
    
    if (type === "week") {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        periods.push({
          key: getPeriodKey(start, "week"),
          label: `${start.toLocaleDateString("en", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en", { month: "short", day: "numeric" })}`,
        });
      }
    } else if (type === "month") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periods.push({
          key: getPeriodKey(date, "month"),
          label: date.toLocaleDateString("en", { month: "short", year: "numeric" }),
        });
      }
    } else if (type === "year") {
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        periods.push({ key: year.toString(), label: year.toString() });
      }
    }
    
    return periods;
  };

  const periods = useMemo(() => generatePeriods(periodType), [periodType]);

  // Filter revenue activity by current period
  const currentPeriodKey = periods[currentIndex]?.key || "";
  const periodData = useMemo(() => {
    return revenueActivity
      .filter((item) => {
        const itemKey = getPeriodKey(item.createdAt, periodType);
        return itemKey === currentPeriodKey;
      })
      .reduce((acc, item) => {
        const existing = acc.find((x) => x.name === item.planName);
        if (existing) {
          existing.revenue += item.price || 0;
        } else {
          acc.push({ 
            name: item.planName || "Unknown Plan", 
            revenue: item.price || 0 
          });
        }
        return acc;
      }, []);
  }, [revenueActivity, currentPeriodKey, periodType]);

  // Chart data: revenue trend over time
  const chartData = useMemo(() => {
    const map = {};
    revenueActivity.forEach((item) => {
      const key = getPeriodKey(item.createdAt, periodType);
      const periodObj = periods.find((p) => p.key === key);
      if (periodObj) {
        if (!map[key]) map[key] = { period: periodObj.label, revenue: 0 };
        map[key].revenue += item.price || 0;
      }
    });
    
    // Sort by period order
    return periods
      .map(period => ({
        period: period.label,
        revenue: map[period.key]?.revenue || 0
      }))
      .filter(item => item.revenue > 0 || periodType !== "week"); // Show only periods with data
  }, [revenueActivity, periodType, periods]);

  // Top plans in current period
  const topPlans = useMemo(() => {
    const periodRevenue = periodData.reduce((sum, item) => sum + item.revenue, 0);
    
    return periodData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        percentage: periodRevenue > 0 ? Math.round((p.revenue / periodRevenue) * 100) : 0,
      }));
  }, [periodData]);

  // Fix navigation logic - reversed the conditions
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < periods.length - 1;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Analytics</CardTitle>
            <CardDescription>
              {periodType === "week" ? "Weekly" : periodType === "month" ? "Monthly" : "Yearly"} revenue trends
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={!hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium">
              {periods[currentIndex]?.label || "N/A"}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={!hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Period Type Selector */}
        <div className="flex gap-2 mt-3">
          {["week", "month", "year"].map((type) => (
            <Button
              key={type}
              variant={periodType === type ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPeriodType(type);
                setCurrentIndex(periods.length - 1); // Start with most recent period
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Revenue Trend Chart */}
        <div>
          <p className="mb-4 text-sm font-medium text-foreground">Revenue Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.length > 0 ? chartData : [{ period: "No data", revenue: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                formatter={(value) => [`$${value}`, "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Plans in Selected Period */}
        <div>
          <p className="mb-4 text-sm font-medium text-foreground">
            Top Plans ({periods[currentIndex]?.label || "Period"})
          </p>
          <div className="space-y-3">
            {topPlans.length > 0 ? (
              topPlans.map((p, i) => (
                <div key={i}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.name}</span>
                    <span className="font-medium text-foreground">
                      ${p.revenue} ({p.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${p.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sales in this period</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}