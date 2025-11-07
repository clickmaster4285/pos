'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

export default function PlanSelection({
  plans,
  selectedPlan,
  onPlanSelect,
  isLoading,
  isChangingPlan,
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  const getPlanFeatures = (plan) => [
    `${plan.limitations?.maxStaff || 0} Staff Members`,
    `${plan.limitations?.maxVendors || 0} Vendors`,
    `${plan.limitations?.maxInventoryItems || 0} Inventory Items`,
    ...(plan.limitations?.features || []).map((feature) =>
      feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">
          Select the plan that best fits your business needs
        </p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan, index) => (
          <Card
            key={plan._id}
            className={`relative cursor-pointer transition-all duration-200 hover:z-5 hover:outline-primary/50 outline min-w-62 ${
              selectedPlan === plan._id
                ? 'ring-2 ring-primary/50 border-primary/50 shadow-lg'
                : 'hover:shadow-md hover:border-gray-300'
            } ${isChangingPlan ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => !isChangingPlan && onPlanSelect(plan._id)}
          >
            {index === 0 && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-secondary-foreground flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Popular
                </Badge>
              </div>
            )}

            <CardContent className="p-6 flex flex-col h-full">
              {/* Top section (plan info + features) */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {plan.name}
                    </h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        Rs {plan.price}
                      </span>
                      <span className="text-gray-600">
                        /{plan.interval || 'month'}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-gray-600 text-sm mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mt-6">
                    {getPlanFeatures(plan).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom aligned button */}
              <Button
                className={`w-full mt-6 ${
                  selectedPlan === plan._id
                    ? 'bg-primary text-secondary-foreground  hover:bg-primary/80'
                    : 'bg-primary text-secondary-foreground  hover:bg-primary/80'
                } ${isChangingPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                variant={selectedPlan === plan._id ? 'default' : 'outline'}
                disabled={isChangingPlan}
              >
                {isChangingPlan ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin   " />
                    Changing...
                  </div>
                ) : selectedPlan === plan._id ? (
                  'Selected'
                ) : (
                  'Select Plan'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
