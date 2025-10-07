'use client';

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const AttendanceTable = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = records.filter(
    (record) =>
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const variants = {
      present: "bg-success/10 text-success border-success/20",
      absent: "bg-destructive/10 text-destructive border-destructive/20",
      late: "bg-warning/10 text-warning border-warning/20",
      "half-day": "bg-primary/10 text-primary border-primary/20",
    };

    const labels = {
      present: "Present",
      absent: "Absent",
      late: "Late",
      "half-day": "Half Day",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Card className="p-6 border-border bg-card">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Employee ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Check In</TableHead>
              <TableHead className="font-semibold">Check Out</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground">
                  {record.employeeId}
                </TableCell>
                <TableCell className="text-foreground">{record.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {record.checkIn || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {record.checkOut || "—"}
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No attendance records found
        </div>
      )}
    </Card>
  );
};

export default AttendanceTable;