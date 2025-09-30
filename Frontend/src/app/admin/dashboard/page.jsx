'use client';
import React from 'react';
import { Users, Package, ShoppingCart, CreditCard, UserCheck, TrendingUp, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for the dashboard
const statsData = [
  { 
    title: 'Total Staff', 
    value: '47', 
    change: '+12%', 
    icon: Users, 
    gradient: 'bg-stat-gradient-1',
    description: 'Active employees'
  },
  { 
    title: 'Inventory Items', 
    value: '1,247', 
    change: '+8%', 
    icon: Package, 
    gradient: 'bg-stat-gradient-2',
    description: 'In stock items'
  },
  { 
    title: 'Monthly Orders', 
    value: '892', 
    change: '+23%', 
    icon: ShoppingCart, 
    gradient: 'bg-stat-gradient-3',
    description: 'This month'
  },
  { 
    title: 'Revenue', 
    value: '$52,430', 
    change: '+18%', 
    icon: CreditCard, 
    gradient: 'bg-stat-gradient-4',
    description: 'Monthly total'
  }
];

const alertsData = [
  { type: 'salary', message: 'Monthly salary payments due in 3 days', priority: 'high' },
  { type: 'inventory', message: 'Low stock alert: 15 items below threshold', priority: 'medium' },
  { type: 'staff', message: '3 staff members have pending leave requests', priority: 'low' },
  { type: 'vendor', message: 'Vendor payment overdue: ABC Supplies', priority: 'high' }
];

const recentActivity = [
  { user: 'John Manager', action: 'Created new staff member', time: '2 mins ago', type: 'staff' },
  { user: 'Sarah Receptionist', action: 'Updated inventory count', time: '15 mins ago', type: 'inventory' },
  { user: 'Mike Mechanic', action: 'Completed work order #1234', time: '1 hour ago', type: 'order' },
  { user: 'System', action: 'Automated salary calculation completed', time: '2 hours ago', type: 'system' }
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden border-0 shadow-admin-md">
            <div className={`absolute inset-0 opacity-10 ${stat.gradient}`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs">
                <Badge variant="secondary" className="text-success">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stat.change}
                </Badge>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alerts Panel */}
        <Card className="lg:col-span-2 shadow-admin-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>Alerts & Notifications</span>
            </CardTitle>
            <CardDescription>Important system alerts and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertsData.map((alert, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${
                    alert.priority === 'high' ? 'bg-destructive' : 
                    alert.priority === 'medium' ? 'bg-warning' : 'bg-success'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground capitalize">{alert.type} alert</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-admin-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.user}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-admin-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used admin functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col space-y-2 bg-stat-gradient-1 hover:opacity-90">
              <Users className="h-6 w-6" />
              <span>Add Staff</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Package className="h-6 w-6" />
              <span>Update Inventory</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <UserCheck className="h-6 w-6" />
              <span>Manage Vendors</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;