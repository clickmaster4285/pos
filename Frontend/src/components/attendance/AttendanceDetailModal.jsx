// AttendanceDetailModal.jsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { formatTime, formatDate } from '@/utils/dateUtils';

const AttendanceDetailModal = ({ isOpen, onClose, records, userId, userName }) => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const modalRef = useRef(null);

  const toggleDropdown = (date) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) firstElement.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter and process records based on date range
  const processedRecords = useMemo(() => {
    const userRecords = records.filter(record => record.userId === userId);
    
    // Apply date range filter if set
    const filteredRecords = userRecords.filter(record => {
      const recordDate = formatDate(record.checkTime);
      if (dateRange.from && dateRange.to) {
        return recordDate >= dateRange.from && recordDate <= dateRange.to;
      } else if (dateRange.from) {
        return recordDate === dateRange.from;
      }
      return true;
    });

    return filteredRecords.reduce((acc, record) => {
      const date = formatDate(record.checkTime);
      if (!acc[date]) {
        acc[date] = { 
          checkIn: null, 
          checkOut: null, 
          verificationMode: null, 
          type: '—', 
          rawRecords: [] 
        };
      }
      
      if (record.type === 'checkin') {
        const time = new Date(record.checkTime);
        if (!acc[date].checkIn || time < new Date(acc[date].checkIn)) {
          acc[date].checkIn = formatTime(record.checkTime);
          acc[date].verificationMode = record.verificationMode;
        }
      } else if (record.type === 'checkout') {
        const time = new Date(record.checkTime);
        if (!acc[date].checkOut || time > new Date(acc[date].checkOut)) {
          acc[date].checkOut = formatTime(record.checkTime);
          acc[date].verificationMode = record.verificationMode;
        }
      }
      
      acc[date].type = acc[date].checkIn && acc[date].checkOut ? 'Complete' : 
                       acc[date].checkIn ? 'Check In' : 
                       acc[date].checkOut ? 'Check Out' : '—';
      acc[date].rawRecords.push(record);
      return acc;
    }, {});
  }, [records, userId, dateRange]);

  const recordList = Object.entries(processedRecords)
    .map(([date, data], index) => ({
      id: index,
      date,
      checkIn: data.checkIn || "—",
      checkOut: data.checkOut || "—",
      type: data.type,
      verificationMode: data.verificationMode || "—",
      rawRecords: data.rawRecords.sort((a, b) => new Date(b.checkTime) - new Date(a.checkTime)),
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const resetDateFilter = () => {
    setDateRange({ from: '', to: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white border-slate-200 p-0 rounded-2xl shadow-2xl" ref={modalRef}>
        <DialogHeader className="p-6 border-b border-slate-200">
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Attendance Details - {userName}
          </DialogTitle>
          <p className="text-slate-600 mt-1">User ID: {userId}</p>
        </DialogHeader>

        {/* Date Filter Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filter by Date:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  placeholder="From date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="bg-white border-slate-300"
                />
                <span className="text-slate-500 text-sm">to</span>
                <Input
                  type="date"
                  placeholder="To date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-white border-slate-300"
                />
              </div>
              <Button
                variant="outline"
                onClick={resetDateFilter}
                className="border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-auto">
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Check-In</TableHead>
                  <TableHead className="font-semibold text-slate-700">Check-Out</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Verification</TableHead>
                  <TableHead className="font-semibold text-slate-700">History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordList.map((record, index) => (
                  <>
                    <TableRow
                      key={record.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <TableCell className="font-medium text-slate-800">{record.date}</TableCell>
                      <TableCell className={record.checkIn !== "—" ? "text-green-600 font-medium" : "text-slate-500"}>
                        {record.checkIn}
                      </TableCell>
                      <TableCell className={record.checkOut !== "—" ? "text-blue-600 font-medium" : "text-slate-500"}>
                        {record.checkOut}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.type === 'Complete' 
                            ? 'bg-green-100 text-green-800'
                            : record.type === 'Check In'
                            ? 'bg-blue-100 text-blue-800'
                            : record.type === 'Check Out'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {record.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600">{record.verificationMode}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDropdown(record.date)}
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                        >
                          {openDropdowns[record.date] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openDropdowns[record.date] && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50/80 p-4">
                          <div className="mb-3">
                            <h4 className="font-semibold text-slate-800 mb-2">
                              Attendance History - {record.date}
                            </h4>
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-100">
                                    <TableHead className="text-slate-700">Time</TableHead>
                                    <TableHead className="text-slate-700">Type</TableHead>
                                    <TableHead className="text-slate-700">Verification</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {record.rawRecords.map((rawRecord, idx) => (
                                    <TableRow key={idx} className="hover:bg-slate-50">
                                      <TableCell className="font-mono text-sm">
                                        {formatTime(rawRecord.checkTime)}
                                      </TableCell>
                                      <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          rawRecord.type === 'checkin' 
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {rawRecord.type.charAt(0).toUpperCase() + rawRecord.type.slice(1)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-slate-600">
                                        {rawRecord.verificationMode}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {recordList.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-medium">
              No attendance records found for {userName}
              {dateRange.from && ` in the selected date range`}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-800 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDetailModal;