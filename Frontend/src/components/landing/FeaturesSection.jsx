"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Check } from 'lucide-react';

const adminFeatures = [
  {
    title: "Vendor & Product Management",
    description: "Complete control over suppliers and inventory"
  },
  {
    title: "Staff Management & Attendance",
    description: "Track team performance and work hours with integrated attendance machines"
  },
  {
    title: "Warehouse Operations",
    description: "Multi-location inventory with automated stock transfers"
  },
  {
    title: "Financial Reports & Analytics",
    description: "Real-time insights with customizable dashboards and export capabilities"
  },
  {
    title: "Company Settings & Branding",
    description: "Customize receipts, invoices, and system appearance"
  },
  {
    title: "Salary & Payroll Management",
    description: "Automated salary calculations with attendance integration"
  },
  {
    title: "Courier & Delivery Management",
    description: "Track deliveries and manage multiple courier services"
  },
  {
    title: "Multi-location Support",
    description: "Centralized control across unlimited business locations"
  }
];

const staffFeatures = [
  {
    title: "Point of Sale Interface",
    description: "Fast, intuitive checkout with barcode scanning"
  },
  {
    title: "Inventory Lookup",
    description: "Real-time stock availability with location tracking"
  },
  {
    title: "Customer Management",
    description: "Build relationships with customer profiles and purchase history"
  },
  {
    title: "Order Processing",
    description: "Seamless order handling from creation to fulfillment"
  },
  {
    title: "Sales Reports",
    description: "Personal performance metrics and daily summaries"
  },
  {
    title: "Profile Settings",
    description: "Mandatory access for all staff to manage personal information"
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Every Role</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Complete control for admins with role-based access, streamlined tools for staff. Every feature is controlled by the company owner to ensure perfect workflow alignment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Admin */}
          <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-card animate-slide-up group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Admin & Owner</CardTitle>
              </div>
              <CardDescription>Complete business management and control</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {adminFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm">{f.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Staff */}
          <Card className="border-2 hover:border-accent/50 transition-all bg-gradient-card animate-slide-up group" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Staff</CardTitle>
              </div>
              <CardDescription>Efficient daily operations with controlled access</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {staffFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm">{f.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-3 bg-muted/50 rounded-lg border">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Staff access is fully controlled by the company owner. Profile settings and dashboard are mandatory for all staff, while additional features can be enabled based on your business needs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};