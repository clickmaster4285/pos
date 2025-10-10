// AttendanceTable.jsx
'use client';

import { useState, useMemo } from "react";
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
import { Search, User, Calendar } from "lucide-react";
import AttendanceDetailModal from "./AttendanceDetailModal";

const AttendanceTable = ({ records, rawRecords }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const debouncedSetSearchTerm = debounce(setSearchTerm, 300);

  const filteredRecords = useMemo(() => {
    return records.filter(
      (record) =>
        record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const handleRowClick = (record) => {
    setSelectedUser({ userId: record.userId, userName: record.name });
    setIsModalOpen(true);
  };

  return (
    <Card className="p-6 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">Attendance Records</h2>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
            {filteredRecords.length} records
          </span>
        </div>
        
        <div className="relative max-w-md w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or user ID..."
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 focus:border-slate-400 rounded-xl transition-colors duration-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700 py-4">User ID</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Employee</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Date</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Check-In</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Check-Out</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record, index) => (
              <TableRow
                key={record.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                }`}
              >
                <TableCell className="font-mono text-sm text-slate-600 py-4">
                  {record.userId}
                </TableCell>
                <TableCell className="py-4">
                  <button
                    onClick={() => handleRowClick(record)}
                    className="flex items-center gap-3 text-left hover:text-blue-600 transition-colors duration-150 group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-150">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 group-hover:text-blue-600">
                        {record.name}
                      </p>
                      <p className="text-xs text-slate-500">View details</p>
                    </div>
                  </button>
                </TableCell>
                <TableCell className="text-slate-700 font-medium py-4">
                  {record.date}
                </TableCell>
                <TableCell className="py-4">
                  <span className={`font-medium ${
                    record.checkinTime !== '—' 
                      ? 'text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm'
                      : 'text-slate-400'
                  }`}>
                    {record.checkinTime}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <span className={`font-medium ${
                    record.checkoutTime !== '—' 
                      ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-sm'
                      : 'text-slate-400'
                  }`}>
                    {record.checkoutTime}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.checkinTime !== '—' && record.checkoutTime !== '—'
                      ? 'bg-green-100 text-green-800'
                      : record.checkinTime !== '—' || record.checkoutTime !== '—'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {record.checkinTime !== '—' && record.checkoutTime !== '—' 
                      ? 'Complete' 
                      : record.checkinTime !== '—' 
                      ? 'Check In Only'
                      : record.checkoutTime !== '—'
                      ? 'Check Out Only'
                      : 'No Record'
                    }
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-2">No records found</p>
            <p className="text-slate-500 text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'No attendance records available'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <AttendanceDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          records={rawRecords}
          userId={selectedUser.userId}
          userName={selectedUser.userName}
        />
      )}
    </Card>
  );
};

export default AttendanceTable;