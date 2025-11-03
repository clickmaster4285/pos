"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Utensils, Shirt, Pill, Laptop, Store, Check } from 'lucide-react';

const industries = [ {
    icon: Utensils,
    title: "Restaurant",
    description: "Complete dining management with ingredients tracking",
    features: ["Table Management", "Kitchen Display", "Ingredient Tracking", "Recipe Costing"],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    detailedFeatures: [
      "Table and order management with real-time updates",
      "Kitchen Display System (KDS) for seamless kitchen operations",
      "Ingredient-level inventory tracking and waste management",
      "Recipe costing and menu engineering tools",
      "Split bills and table transfers",
      "Multiple payment methods and tips management",
      "Online ordering and delivery integration",
      "Customer reservation system"
    ],
    benefits: "Perfect for cafes, fine dining, fast food chains, and cloud kitchens. Reduce food waste by 30% and improve table turnover by 25%."
  },
  {
    icon: Shirt,
    title: "Fashion",
    description: "Inventory & sales for clothing retail",
    features: ["Size/Color Variants", "Seasonal Collections", "Style Categories", "Trend Analytics"],
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    detailedFeatures: [
      "Multi-variant product management (size, color, style)",
      "Seasonal collection tracking and planning",
      "Barcode and SKU management for each variant",
      "Style and trend analytics dashboard",
      "Customer size preferences and purchase history",
      "Return and exchange management",
      "Loyalty programs and promotional campaigns",
      "Integration with e-commerce platforms"
    ],
    benefits: "Ideal for boutiques, fashion chains, and clothing stores. Increase sales by 40% with personalized customer insights and reduce stockouts by 35%."
  },
  {
    icon: Pill,
    title: "Pharmacy",
    description: "Prescription tracking & medical supplies",
    features: ["Prescription Management", "Expiry Tracking", "Drug Interactions", "Insurance Claims"],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    detailedFeatures: [
      "Digital prescription management and verification",
      "Automated expiry date tracking with alerts",
      "Drug interaction warnings and contraindications",
      "Insurance claim processing and verification",
      "Controlled substance tracking and reporting",
      "Patient medication history and profiles",
      "Doctor and prescription database integration",
      "Regulatory compliance and audit reports"
    ],
    benefits: "Essential for pharmacies and medical stores. Ensure 100% regulatory compliance and reduce medication errors by 95% with automated safety checks."
  },
  {
    icon: Laptop,
    title: "Electronics",
    description: "Tech retail with warranty management",
    features: ["Serial Number Tracking", "Warranty Management", "Repair Services", "Trade-in Support"],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    detailedFeatures: [
      "Serial number and IMEI tracking for each device",
      "Automated warranty registration and tracking",
      "Repair and service ticket management",
      "Trade-in and buyback program support",
      "Product specifications and comparison tools",
      "Extended warranty sales integration",
      "Supplier and manufacturer warranty claims",
      "Customer device history and support tickets"
    ],
    benefits: "Perfect for electronics retailers and mobile shops. Increase customer satisfaction by 50% with comprehensive warranty tracking and service management."
  },
  {
    icon: Store,
    title: "General Shop",
    description: "Flexible POS for any retail business",
    features: ["Multi-Category Support", "Barcode Scanning", "Quick Checkout", "Loyalty Programs"],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    detailedFeatures: [
      "Unlimited product categories and subcategories",
      "Fast barcode scanning and product lookup",
      "Quick checkout with keyboard shortcuts",
      "Customer loyalty and rewards programs",
      "Discount and promotion management",
      "Multiple payment methods support",
      "Sales reports and inventory analytics",
      "Supplier management and purchase orders"
    ],
    benefits: "Flexible solution for grocery stores, gift shops, convenience stores, and any retail business. Reduce checkout time by 60% and increase repeat customers by 45%."
  }];

export const IndustriesSection = () => {
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  return (
    <>
      <section id="industries" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Your Industry</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tailored features for restaurants, retail, pharmacy, electronics, and general stores. Click any industry to explore detailed features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {industries.map((industry, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedIndustry(industry)}
              >
                <CardHeader className="text-center pb-4">
                  <industry.icon className={`h-12 w-12 mx-auto mb-3 ${industry.color} transition-transform group-hover:scale-110 duration-300`} />
                  <CardTitle className="text-lg">{industry.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center mb-4">{industry.description}</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {industry.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-primary"></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-primary font-medium text-center mt-4 group-hover:underline">
                    Click for details →
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedIndustry} onOpenChange={() => setSelectedIndustry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedIndustry && (
            <>
              <DialogHeader>
                <div className={`w-16 h-16 rounded-lg ${selectedIndustry.bgColor} flex items-center justify-center mb-4`}>
                  <selectedIndustry.icon className={`h-8 w-8 ${selectedIndustry.color}`} />
                </div>
                <DialogTitle className="text-2xl">{selectedIndustry.title} POS System</DialogTitle>
                <DialogDescription className="text-base">{selectedIndustry.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-primary border-primary">Key Features</Badge>
                  </h3>
                  <ul className="grid gap-3">
                    {selectedIndustry.detailedFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-4 rounded-lg ${selectedIndustry.bgColor} border-l-4 border-${selectedIndustry.color.replace('text-', '')}`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className={selectedIndustry.color}>Why Choose Us?</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedIndustry.benefits}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};