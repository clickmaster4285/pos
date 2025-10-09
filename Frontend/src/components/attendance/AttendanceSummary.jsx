'use client';

import { Card } from "@/components/ui/card";
import { Users, LogIn, LogOut } from "lucide-react";

const AttendanceSummary = ({ total, checkIns, checkOuts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <Card
        className="p-6 border-border bg-card hover:shadow-lg transition-all duration-300"
        role="region"
        aria-label="Total Logs Summary"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Logs</p>
            <p className="text-3xl font-bold text-foreground">
              {total || 0}
              {total === 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">No logs</span>
              )}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
        </div>
      </Card>

      <Card
        className="p-6 border-border bg-card hover:shadow-lg transition-all duration-300"
        role="region"
        aria-label="Check-Ins Summary"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Check-Ins</p>
            <p className="text-3xl font-bold text-success">
              {checkIns || 0}
              {checkIns === 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">No check-ins</span>
              )}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-success" aria-hidden="true" />
          </div>
        </div>
      </Card>

      <Card
        className="p-6 border-border bg-card hover:shadow-lg transition-all duration-300"
        role="region"
        aria-label="Check-Outs Summary"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Check-Outs</p>
            <p className="text-3xl font-bold text-primary">
              {checkOuts || 0}
              {checkOuts === 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">No check-outs</span>
              )}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LogOut className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttendanceSummary;