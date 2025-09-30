'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Users,
  Package,
  Building2,
  BarChart3,
  FileText,
  Truck,
  HeadphonesIcon,
  Car,
  Wrench,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
// --- Sample data (pure JS) ---
const samplePlans = [
  {
    name: 'Starter',
    description:
      'Perfect for small automotive shops getting started with digital management',
    price: 49,
    validateDays: 14,
    limitations: {
      maxStaff: 5,
      maxInventoryItems: 500,
      maxVendors: 10,
      features: ['inventory_management', 'support'],
    },
    isActive: true,
  },
  {
    name: 'Professional',
    description:
      'Ideal for growing automotive businesses that need comprehensive features',
    price: 149,
    validateDays: 30,
    limitations: {
      maxStaff: 25,
      maxInventoryItems: 2500,
      maxVendors: 50,
      features: [
        'analytics',
        'reports',
        'inventory_management',
        'vendor_management',
        'support',
      ],
    },
    isActive: true,
  },
  {
    name: 'Enterprise',
    description:
      'Complete solution for large automotive operations with advanced needs',
    price: 299,
    validateDays: 30,
    limitations: {
      maxStaff: 100,
      maxInventoryItems: 10000,
      maxVendors: 200,
      features: [
        'analytics',
        'reports',
        'inventory_management',
        'vendor_management',
        'order_tracking',
        'support',
      ],
    },
    isActive: true,
  },
];
import { useGetAllPlansQuery } from '@/features/planApi';
// --- Helpers (plain JS objects) ---
const featureIcons = {
  analytics: BarChart3,
  reports: FileText,
  inventory_management: Package,
  vendor_management: Building2,
  order_tracking: Truck,
  support: HeadphonesIcon,
};

const featureLabels = {
  analytics: 'Advanced Analytics',
  reports: 'Custom Reports',
  inventory_management: 'Inventory Management',
  vendor_management: 'Vendor Management',
  order_tracking: 'Order Tracking',
  support: 'Priority Support',
};

// --- Local subcomponents (JSX only) ---
function PlansHeader() {
  return (
    <div className="text-center space-y-6 mb-16">
      <div className="flex justify-center items-center gap-2 mb-4">
        <h1 className="text-4xl font-bold text-balance">AutoPro Management</h1>
      </div>

      <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
        Streamline your automotive business with our comprehensive management
        platform. Choose the perfect plan to manage inventory, vendors, and
        operations efficiently.
      </p>

      <div className="flex justify-center items-center gap-8 mt-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="text-sm">Industry Specific</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-sm">Advanced Analytics</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Car className="h-5 w-5 text-primary" />
          <span className="text-sm">Automotive Focused</span>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, isPopular = false, onSelectPlan }) {
  const router = useRouter();

  const hasLimits = !!plan?.limitations;
  const maxStaff = hasLimits ? plan.limitations.maxStaff : 0;
  const maxInventory = hasLimits ? plan.limitations.maxInventoryItems : 0;
  const maxVendors = hasLimits ? plan.limitations.maxVendors : 0;
  const features = hasLimits ? plan.limitations.features || [] : [];

  return (
    <Card
      onClick={() => router.push('/sign-up')}
      className={`relative h-full transition-all duration-300 hover:shadow-lg ${
        isPopular
          ? 'border-primary shadow-md scale-105 hover:scale-110'
          : 'hover:border-primary/50 hover:scale-105'
      }`}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-balance">
          {plan.name}
        </CardTitle>

        {/* Price first */}
        <div className="mt-3">
          <span className="text-4xl font-bold text-primary">${plan.price}</span>
        </div>

        {/* Validity line (not “free trial”) */}
        {plan.validateDays ? (
          <p className="text-sm text-muted-foreground mt-1">
            Valid for {plan.validateDays}{' '}
            {plan.validateDays === 1 ? 'day' : 'days'}
          </p>
        ) : null}

        {/* Description AFTER price */}
        {plan.description ? (
          <CardDescription className="text-pretty mt-2">
            {plan.description}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Limits */}
        {hasLimits && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">Up to {maxStaff} staff members</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Up to {maxInventory} inventory items
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Up to {maxVendors} vendors</span>
            </div>
          </div>
        )}

        {/* Features */}
        {features?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Included Features
            </h4>
            <div className="space-y-2">
              {features.map((feature) => {
                const Icon = featureIcons[feature];
                const label = featureLabels[feature] || feature;
                return (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {Icon ? (
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : null}
                    <span className="text-sm">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className={`w-full ${
            isPopular
              ? 'bg-secondary-foreground hover:bg-secondary-foreground/90'
              : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlan?.(plan);
          }}
        >
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}

function FeatureComparison() {
  const features = [
    {
      icon: BarChart3,
      name: 'Advanced Analytics',
      description:
        'Real-time insights into your automotive business performance with customizable dashboards and KPI tracking.',
    },
    {
      icon: FileText,
      name: 'Custom Reports',
      description:
        'Generate detailed reports for inventory, sales, vendor performance, and operational metrics.',
    },
    {
      icon: Package,
      name: 'Inventory Management',
      description:
        'Track parts, tools, and equipment with automated reorder points and supplier integration.',
    },
    {
      icon: Building2,
      name: 'Vendor Management',
      description:
        'Manage supplier relationships, track performance, and streamline procurement processes.',
    },
    {
      icon: Truck,
      name: 'Order Tracking',
      description:
        'Monitor orders from placement to delivery with real-time status updates and notifications.',
    },
    {
      icon: HeadphonesIcon,
      name: 'Priority Support',
      description:
        'Get dedicated support from our automotive industry experts with faster response times.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-balance mb-4">
          Everything You Need to Manage Your Automotive Business
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Our platform is specifically designed for automotive businesses, with
          features that address the unique challenges of managing inventory,
          vendors, and operations in the automotive industry.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.name}
              className="h-full hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-pretty">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// --- Single exported page/component (JSX only) ---
export default function PricingPlan() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const router = useRouter();

  // ✅ Get plans from API
  const { data: apiPlans = [], isLoading, error } = useGetAllPlansQuery();

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    console.log('Selected plan:', plan.name);
    router.push('/sign-up');
  };

  // Use API data if available, otherwise fallback
  const plansToShow = apiPlans.length > 0 ? apiPlans : samplePlans;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <PlansHeader />

        {/* Plans Grid */}
        {isLoading ? (
          <p className="text-center">Loading plans…</p>
        ) : error ? (
          <p className="text-center text-red-500">
            Failed to load plans. Showing defaults.
          </p>
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {plansToShow.map((plan, index) => (
            <PlanCard
              key={plan._id || plan.name}
              plan={plan}
              isPopular={index === 1}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>

        <FeatureComparison />

        {/* CTA Section */}
        <div className="text-center mt-20 p-8 bg-muted rounded-lg">
          <h3 className="text-2xl font-bold mb-4 text-balance">
            Ready to Transform Your Automotive Business?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-pretty">
            Join thousands of automotive professionals who trust our platform to
            streamline their operations and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              onClick={() => router.push('/sign-up')}
            >
              Start Free Trial
            </button>
            <button
              className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              onClick={() => router.push('/sign-up')}
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
