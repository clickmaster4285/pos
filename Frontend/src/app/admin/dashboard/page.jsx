'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import {
  Package,
  Car,
  AlertTriangle,
  Clock3,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
// ---- Dummy Data ----
const DATA = {
  kpis: {
    openOrders: 12,
    vehiclesInService: 8,
    lowStockItems: 5,
    onTimeRate: 92,
    revenueMTD: 48250,
  },
  trends: [
    { day: 'Sep 01', workOrders: 6, revenue: 2100 },
    { day: 'Sep 02', workOrders: 5, revenue: 1800 },
    { day: 'Sep 03', workOrders: 7, revenue: 2400 },
    { day: 'Sep 04', workOrders: 4, revenue: 1600 },
    { day: 'Sep 05', workOrders: 8, revenue: 2900 },
    { day: 'Sep 06', workOrders: 6, revenue: 2200 },
    { day: 'Sep 07', workOrders: 5, revenue: 1750 },
    { day: 'Sep 08', workOrders: 7, revenue: 2450 },
    { day: 'Sep 09', workOrders: 9, revenue: 3100 },
    { day: 'Sep 10', workOrders: 6, revenue: 2150 },
    { day: 'Sep 11', workOrders: 5, revenue: 1850 },
    { day: 'Sep 12', workOrders: 8, revenue: 3000 },
    { day: 'Sep 13', workOrders: 7, revenue: 2600 },
    { day: 'Sep 14', workOrders: 6, revenue: 2300 },
  ],
  workOrders: [
    {
      id: 'WO-1042',
      vehicle: 'Toyota Corolla 2018',
      type: 'Brake Service',
      status: 'In Progress',
      eta: 'Today 5:00 PM',
    },
    {
      id: 'WO-1041',
      vehicle: 'Honda Civic 2020',
      type: 'Oil Change',
      status: 'Open',
      eta: 'Today 3:00 PM',
    },
    {
      id: 'WO-1038',
      vehicle: 'Ford F-150 2017',
      type: 'Suspension',
      status: 'Delayed',
      eta: 'Tomorrow 11:00 AM',
    },
    {
      id: 'WO-1035',
      vehicle: 'Kia Sportage 2019',
      type: 'AC Repair',
      status: 'Completed',
      eta: '—',
    },
    {
      id: 'WO-1032',
      vehicle: 'Hyundai Elantra 2021',
      type: 'Alignment',
      status: 'Open',
      eta: 'Tomorrow 2:00 PM',
    },
  ],
  inventory: [
    {
      sku: 'BP-MD-001',
      name: 'Brake Pads - Medium',
      qty: 12,
      min: 15,
      location: 'A1-03',
    },
    {
      sku: 'OIL-5W30',
      name: 'Engine Oil 5W-30',
      qty: 24,
      min: 20,
      location: 'B2-07',
    },
    { sku: 'FLT-AC-09', name: 'AC Filter', qty: 6, min: 10, location: 'A3-11' },
    {
      sku: 'Belt-ALT',
      name: 'Alternator Belt',
      qty: 18,
      min: 12,
      location: 'C1-02',
    },
    {
      sku: 'ROT-FT-12',
      name: 'Front Rotors',
      qty: 9,
      min: 8,
      location: 'A2-05',
    },
    {
      sku: 'TIRE-17',
      name: 'Tire 215/55R17',
      qty: 3,
      min: 10,
      location: 'D4-01',
    },
  ],
};

export default function AdminDashboard() {
  const k = DATA.kpis;
  const trends = DATA.trends;
  const workOrders = DATA.workOrders;
  const inventory = DATA.inventory;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <main className=" mx-auto px-4 py-8">
        {/* Welcome Section (theme style) */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
            Automotive Dashboard
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Comprehensive oversight and management of your automotive operations
            ecosystem
          </p>
        </div>

        {/* Themed KPI Stats (full width, icon at right, subtle trend) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Open Orders"
            value={k.openOrders}
            Icon={Package}
            accent="text-chart-1"
          />
          <StatCard
            title="Vehicles in Service"
            value={k.vehiclesInService}
            Icon={Car}
            accent="text-chart-2"
          />
          <StatCard
            title="Low-Stock Items"
            value={k.lowStockItems}
            hint="Below min level"
            Icon={AlertTriangle}
            accent="text-chart-4"
          />
          <StatCard
            title="On-Time Rate"
            value={`${k.onTimeRate}%`}
            Icon={Clock3}
            accent="text-chart-3"
          />
          <StatCard
            title="Revenue (MTD)"
            value={`$${Intl.NumberFormat().format(k.revenueMTD)}`}
            Icon={DollarSign}
            accent="text-chart-5"
          />
        </section>

        {/* Main Content Grid (theme layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left: Charts (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="transition hover:shadow-md border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-pretty">
                  Work Orders (last 14 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80 md:h-84 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="workOrders"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="transition hover:shadow-md border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-pretty">
                  Revenue (last 14 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80 md:h-84 pt-0">
                {/* was h-64 */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--chart-2)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right: Lists (theme uses a sidebar—here we stack your tables) */}
          <div className="space-y-6">
            <Card className="overflow-hidden transition hover:shadow-md border-border">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-pretty">Work Orders</CardTitle>
                <Button
                  onClick={() => router.push('/admin/orders')}
                  variant="outline"
                  className="border-primary/40 text-primary bg-transparent"
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="[&>th]:py-2 [&>th]:text-left">
                      <th>ID</th>
                      <th>Vehicle</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th className="text-right">ETA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {workOrders.map((w) => (
                      <tr key={w.id} className="[&>td]:py-2">
                        <td className="font-mono">{w.id}</td>
                        <td>{w.vehicle}</td>
                        <td>{w.type}</td>
                        <td>
                          <StatusBadge status={w.status} />
                        </td>
                        <td className="text-right">{w.eta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition hover:shadow-md border-border">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-pretty">
                  Inventory (low → high)
                </CardTitle>
                <Button
                  variant="outline"
                  className="border-primary/40 text-primary bg-transparent"
                  onClick={() => router.push('/admin/inventory')}
                >
                  Manage
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="[&>th]:py-2 [&>th]:text-left">
                      <th>SKU</th>
                      <th>Part</th>
                      <th>Qty</th>
                      <th>Min</th>
                      <th className="text-right">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventory.map((i) => (
                      <tr key={i.sku} className="[&>td]:py-2">
                        <td className="font-mono">{i.sku}</td>
                        <td>{i.name}</td>
                        <td
                          className={cn(i.qty <= i.min && 'text-destructive')}
                        >
                          {i.qty}
                        </td>
                        <td>{i.min}</td>
                        <td className="text-right">{i.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Automotive ERP. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

/** Themed stat card to mirror the look/feel of DashboardStats */
function StatCard({ title, value, hint, Icon, accent = 'text-chart-1' }) {
  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? <Icon className={cn('h-5 w-5', accent)} /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value ?? <span className="opacity-40">—</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-success">
            <TrendingUp className="w-3 h-3" />
            {hint ?? 'Live'}
          </div>
          <span className="text-xs text-muted-foreground">
            {hint ? 'Below min level' : 'Snapshot'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const styles =
    status === 'Completed'
      ? 'bg-green-100 text-green-800' // <- per your request
      : status === 'Delayed'
      ? 'bg-red-100 text-red-800'
      : 'bg-amber-100 text-amber-800';

  return (
    <span className={cn('rounded px-2 py-1 text-xs', styles)}>{status}</span>
  );
}
