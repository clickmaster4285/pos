// In FeaturesSection.jsx - Better color contrast
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { BarChart3, Users, CreditCard, Smartphone, Cloud, Shield, Zap, Clock } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time insights and performance metrics to drive your business decisions",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Complete CRM with loyalty programs and customer behavior tracking",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  {
    icon: CreditCard,
    title: "Multi-Payment Support",
    description: "Accept all payment methods with secure, instant processing",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30"
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Full functionality on any device with our responsive design",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30"
  },
  {
    icon: Cloud,
    title: "Cloud Backup",
    description: "Automatic cloud synchronization and data protection",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with industry standards",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30"
  }
];

const stats = [
  { icon: Zap, value: "2x", label: "Faster Checkout" },
  { icon: Users, value: "40%", label: "Sales Growth" },
  { icon: Clock, value: "60%", label: "Time Saved" },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-background">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Comprehensive tools designed to streamline operations, boost sales, and enhance customer experience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm group">
                <CardHeader>
                  <div className={`p-3 rounded-2xl ${feature.bgColor} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};