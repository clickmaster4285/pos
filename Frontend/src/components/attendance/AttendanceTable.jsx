'use client';

import { useState } from "react";
import { debounce } from 'lodash';
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
import { Search } from "lucide-react";
import AttendanceDetailModal from "./AttendanceDetailModal";

const AttendanceTable = ({ records, rawRecords }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const debouncedSetSearchTerm = debounce(setSearchTerm, 300);

  const filteredRecords = records.filter(
    (record) =>
      record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (record) => {
    setSelectedUser({ userId: record.userId, userName: record.name });
    setSelectedDate(record.date);
    setIsModalOpen(true);
  };

  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <div className="mb-6">
        <div className="relative max-w-md">
          <label htmlFor="search-input" className="sr-only">Search by name or user ID</label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Search by name or user ID..."
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary"
            aria-label="Search by name or user ID"
          />
        </div>
      </div>

      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">User ID</TableHead>
              <TableHead className="font-semibold text-foreground">Name</TableHead>
              <TableHead className="font-semibold text-foreground">Date</TableHead>
              <TableHead className="font-semibold text-foreground">Check-In</TableHead>
              <TableHead className="font-semibold text-foreground">Check-Out</TableHead>
              <TableHead className="font-semibold text-foreground">Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record, index) => (
              <TableRow
                key={record.id}
                className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
              >
                <TableCell className="font-medium text-foreground">{record.userId}</TableCell>
                <TableCell className="text-foreground">
                  <button
                    onClick={() => handleRowClick(record)}
                    className="text-primary hover:underline font-medium"
                    aria-label={`View attendance details for ${record.name}`}
                  >
                    {record.name}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">{record.date}</TableCell>
                <TableCell className="text-muted-foreground">{record.checkinTime}</TableCell>
                <TableCell className="text-muted-foreground">{record.checkoutTime}</TableCell>
                <TableCell className="text-muted-foreground">{record.verificationMode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-medium">
          No attendance records found for the selected filters
        </div>
      )}

      {selectedUser && (
        <AttendanceDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          records={rawRecords}
          userId={selectedUser.userId}
          userName={selectedUser.userName}
          selectedDate={selectedDate}
        />
      )}
    </Card>
  );
};

export default AttendanceTable;