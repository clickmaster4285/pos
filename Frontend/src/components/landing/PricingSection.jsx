"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const pricingPlans = [
  {
    name: "Starter",
    price: "$49",
    period: "per month",
    description: "Perfect for small businesses",
    features: [
      "1 Location",
      "Up to 5 Staff Members",
      "5,000 Products",
      "Basic Reporting",
      "Email Support",
      "Standard Features",
      "Mobile App Access",
      "Daily Backups"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "$99",
    period: "per month",
    description: "Ideal for growing businesses",
    features: [
      "Up to 3 Locations",
      "Up to 20 Staff Members",
      "Unlimited Products",
      "Advanced Analytics",
      "Priority Support",
      "All Features Included",
      "API Access",
      "Custom Integrations",
      "Real-time Sync",
      "Advanced Reports"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact sales",
    description: "For large organizations",
    features: [
      "Unlimited Locations",
      "Unlimited Staff",
      "Unlimited Products",
      "Custom Integrations",
      "Dedicated Support",
      "Advanced Security",
      "Custom Development",
      "SLA Guarantee",
      "Training & Onboarding",
      "White Label Options"
    ],
    popular: false
  }
];
export const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your business needs. All plans include core POS features with industry-specific tools. Scale as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative hover:shadow-xl transition-all duration-500 animate-fade-in group ${
                plan.popular
                  ? 'border-primary border-2 shadow-lg md:scale-105 bg-card'
                  : 'hover:border-primary/30 bg-gradient-card hover:scale-105'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-scale-in">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && (
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  )}
                  {plan.price === 'Custom' && (
                    <span className="text-muted-foreground text-sm block">{plan.period}</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 animate-fade-in"
                      style={{ animationDelay: `${index * 100 + i * 30}ms` }}
                    >
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full transition-all duration-300 ${
                    plan.popular
                      ? 'bg-primary hover:bg-primary/90 hover:scale-105'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:scale-105'
                  }`}
                  size="lg"
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          All plans include 14-day free trial • No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
};