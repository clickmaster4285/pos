'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatTime, formatDate } from '@/utils/dateUtils';

const AttendanceDetailModal = ({ isOpen, onClose, records, userId, userName, selectedDate }) => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const modalRef = useRef(null);

  // Toggle dropdown visibility for a specific date
  const toggleDropdown = (date) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Manual focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Get all focusable elements within the modal
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element when the modal opens
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab: Move to previous focusable element
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: Move to next focusable element
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      } else if (event.key === 'Escape') {
        // Close modal on Escape key
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Group records by date for the selected user
  const processedRecords = useMemo(() => {
    return records
      .filter(record => record.userId === userId)
      .reduce((acc, record) => {
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
  }, [records, userId]);

  // Convert to array and sort by date descending
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border p-6 rounded-lg shadow-lg" ref={modalRef}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Attendance Details for {userName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Check-In Time</TableHead>
                  <TableHead className="font-semibold text-foreground">Check-Out Time</TableHead>
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Verification</TableHead>
                  <TableHead className="font-semibold text-foreground">History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordList.map((record, index) => (
                  <>
                    <TableRow
                      key={record.id}
                      className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                    >
                      <TableCell className="text-foreground font-medium">{record.date}</TableCell>
                      <TableCell className="text-foreground">{record.checkIn}</TableCell>
                      <TableCell className="text-foreground">{record.checkOut}</TableCell>
                      <TableCell className="text-foreground">{record.type}</TableCell>
                      <TableCell className="text-foreground">{record.verificationMode}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDropdown(record.date)}
                          className="text-foreground hover:text-primary"
                          aria-label={`Toggle attendance history for ${record.date}`}
                          aria-expanded={openDropdowns[record.date]}
                        >
                          <span className={`transform transition-transform ${openDropdowns[record.date] ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openDropdowns[record.date] && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/20 p-4">
                          <div className="text-sm font-medium text-foreground">Attendance History for {record.date}</div>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="text-foreground">Time</TableHead>
                                <TableHead className="text-foreground">Type</TableHead>
                                <TableHead className="text-foreground">Verification</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {record.rawRecords.map((rawRecord, idx) => (
                                <TableRow key={idx} className="hover:bg-muted/10">
                                  <TableCell>{formatTime(rawRecord.checkTime)}</TableCell>
                                  <TableCell>{rawRecord.type.charAt(0).toUpperCase() + rawRecord.type.slice(1)}</TableCell>
                                  <TableCell>{rawRecord.verificationMode}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
          {recordList.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-medium">
              No attendance records found for {userName} in the selected date range
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="border-border hover:bg-muted transition-colors"
              aria-label="Close attendance details modal"
            >
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDetailModal;