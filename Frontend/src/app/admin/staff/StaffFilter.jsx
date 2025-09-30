'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

const StaffFilter = ({ searchTerm, setSearchTerm }) => {
  return (
    <Card className="shadow-lg backdrop-blur-sm bg-card/80 border border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="Search staff by name, email, role, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all duration-300"
            />
          </div>
          <Button variant="outline" className="hover:bg-primary/10 transition-all duration-300">
            <Filter className="mr-2 h-4 w-4 text-primary" />
            Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffFilter;