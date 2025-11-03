"use client";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Clock, Zap, TrendingUp } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
      <div className="container mx-auto px-4 py-20 md:py-32 relative">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-scale-in">
            Trusted by 10,000+ Businesses Worldwide
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            The Complete POS System for Every Business
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline operations across restaurants, retail, pharmacy, and more. One powerful platform with role-based access for admins and staff, unlimited possibilities for growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 hover:border-primary transition-colors">
              Schedule Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 mb-8">
            {[
              { num: '10K+', label: 'Active Businesses' },
              { num: '50M+', label: 'Transactions Processed' },
              { num: '99.9%', label: 'Uptime Guaranteed' },
              { num: '24/7', label: 'Support Available' },
            ].map((s, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${(i + 1) * 0.1}s` }}>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{s.num}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: Shield, txt: 'Bank-level Security' },
              { icon: Clock, txt: '24/7 Priority Support' },
              { icon: Zap, txt: 'Setup in Minutes' },
              { icon: TrendingUp, txt: 'Boost Sales by 35%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${(i + 5) * 0.1}s` }}>
                <item.icon className="h-5 w-5 text-primary" />
                <span>{item.txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};