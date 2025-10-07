'use client';

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AttendanceHeader = ({ selectedDate, onDateChange }) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Attendance Dashboard</h1>
          <p className="text-muted-foreground">Monitor employee attendance and check-in/check-out times</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => onDateChange(today)}
            className="border-border hover:bg-muted"
          >
            Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;