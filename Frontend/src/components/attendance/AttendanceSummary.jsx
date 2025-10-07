'use client';

import { Card } from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

const AttendanceSummary = ({ total, present, absent, late }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-6 border-border bg-card hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
            <p className="text-3xl font-bold text-foreground mt-2">{total}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Present</p>
            <p className="text-3xl font-bold text-success mt-2">{present}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Absent</p>
            <p className="text-3xl font-bold text-destructive mt-2">{absent}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Late</p>
            <p className="text-3xl font-bold text-warning mt-2">{late}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-warning" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttendanceSummary;