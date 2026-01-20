// components/landing/IndustriesSection.jsx
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Utensils, Shirt, Pill, Laptop, Store, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Industries } from '@/utils/industryFields';

const industryIcons = {
  "Restaurant": Utensils,
  "Fashion": Shirt,
  "Pharmacy": Pill,
  "Electronics": Laptop,
  "General Shop": Store
};

const industryColors = {
  "Restaurant": { color: "text-orange-500", bgColor: "bg-orange-500/10" },
  "Fashion": { color: "text-pink-500", bgColor: "bg-pink-500/10" },
  "Pharmacy": { color: "text-green-500", bgColor: "bg-green-500/10" },
  "Electronics": { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  "General Shop": { color: "text-purple-500", bgColor: "bg-purple-500/10" }
};

const industryDetails = {
  "Restaurant": {
    description: "Complete dining management with ingredients tracking",
    features: ["Table Management", "Kitchen Display", "Ingredient Tracking", "Recipe Costing"],
    detailedFeatures: [
      "Table and order management with real-time updates",
      "Kitchen Display System (KDS) for seamless kitchen operations",
      "Ingredient-level inventory tracking and waste management",
      "Recipe costing and menu engineering tools",
      "Split bills and table transfers",
      "Multiple payment methods and tips management"
    ],
    benefits: "Perfect for cafes, fine dining, fast food chains, and cloud kitchens. Reduce food waste by 30% and improve table turnover by 25%."
  },
  "Fashion": {
    description: "Inventory & sales for clothing retail",
    features: ["Size/Color Variants", "Seasonal Collections", "Style Categories", "Trend Analytics"],
    detailedFeatures: [
      "Multi-variant product management (size, color, style)",
      "Seasonal collection tracking and planning",
      "Barcode and SKU management for each variant",
      "Style and trend analytics dashboard",
      "Customer size preferences and purchase history"
    ],
    benefits: "Ideal for boutiques, fashion chains, and clothing stores. Increase sales by 40% with personalized customer insights."
  },
  "Pharmacy": {
    description: "Prescription tracking & medical supplies",
    features: ["Prescription Management", "Expiry Tracking", "Drug Interactions", "Insurance Claims"],
    detailedFeatures: [
      "Digital prescription management and verification",
      "Automated expiry date tracking with alerts",
      "Drug interaction warnings and contraindications",
      "Insurance claim processing and verification",
      "Controlled substance tracking and reporting"
    ],
    benefits: "Essential for pharmacies and medical stores. Ensure 100% regulatory compliance and reduce medication errors by 95%."
  },
  "Electronics": {
    description: "Tech retail with warranty management",
    features: ["Serial Number Tracking", "Warranty Management", "Repair Services", "Trade-in Support"],
    detailedFeatures: [
      "Serial number and IMEI tracking for each device",
      "Automated warranty registration and tracking",
      "Repair and service ticket management",
      "Trade-in and buyback program support",
      "Product specifications and comparison tools"
    ],
    benefits: "Perfect for electronics retailers and mobile shops. Increase customer satisfaction by 50%."
  },
  "General Shop": {
    description: "Flexible POS for any retail business",
    features: ["Multi-Category Support", "Barcode Scanning", "Quick Checkout", "Loyalty Programs"],
    detailedFeatures: [
      "Unlimited product categories and subcategories",
      "Fast barcode scanning and product lookup",
      "Quick checkout with keyboard shortcuts",
      "Customer loyalty and rewards programs",
      "Discount and promotion management"
    ],
    benefits: "Flexible solution for grocery stores, gift shops, convenience stores. Reduce checkout time by 60%."
  }
};

export const IndustriesSection = () => {
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industries, setIndustries] = useState([]);

  useEffect(() => {
    const loadedIndustries = Industries.map(industry => ({
      ...industryDetails[industry],
      title: industry,
      icon: industryIcons[industry],
      ...industryColors[industry]
    }));
    setIndustries(loadedIndustries);
  }, []);

  return (
    <>
      <section id="industries" className="py-20 bg-linear-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              Industry Solutions
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Built for Your Industry
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tailored solutions for every business type. Click any industry to explore specialized features designed for your success.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {industries.map((industry, index) => (
                <motion.div
                  key={industry.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="h-full cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm overflow-hidden group"
                    onClick={() => setSelectedIndustry(industry)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${industry.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                          <industry.icon className={`h-8 w-8 ${industry.color}`} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                        {industry.title}
                      </CardTitle>
                      <p className="text-muted-foreground mt-2 leading-relaxed">
                        {industry.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {industry.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <Check className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Dialog open={!!selectedIndustry} onOpenChange={() => setSelectedIndustry(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedIndustry && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${selectedIndustry.bgColor}`}>
                    <selectedIndustry.icon className={`h-8 w-8 ${selectedIndustry.color}`} />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold">
                      {selectedIndustry.title}
                    </DialogTitle>
                    <DialogDescription className="text-lg mt-2">
                      {selectedIndustry.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-primary">Key Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedIndustry.detailedFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="text-lg font-semibold mb-2 text-primary">Business Benefits</h4>
                  <p className="text-muted-foreground">{selectedIndustry.benefits}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};