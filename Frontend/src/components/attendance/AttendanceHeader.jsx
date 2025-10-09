'use client';

import { useState, useEffect, useRef } from "react";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTime, formatDate } from '@/utils/dateUtils';

const AttendanceHeader = ({ selectedDate, onDateChange, records, dateRange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generateFullPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Attendance Summary Report", 14, 22);
    doc.setFontSize(12);
    doc.text("Full Report", 14, 32);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    const tableData = records.map(record => [
      record.userId,
      record.name,
      record.date,
      record.checkinTime,
      record.checkoutTime,
      record.verificationMode || "—"
    ]);

    autoTable(doc, {
      head: [['User ID', 'Name', 'Date', 'Check-In', 'Check-Out', 'Verification']],
      body: tableData,
      startY: 50,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 11 },
      bodyStyles: { fontSize: 10, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`attendance_full_${today}.pdf`);
    setIsDropdownOpen(false);
  };

  const generateFilteredPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Attendance Summary Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 14, 32);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    const filteredRecords = records.filter(record => {
      const recordDate = record.date;
      return recordDate >= dateRange.from && recordDate <= dateRange.to;
    });

    const tableData = filteredRecords.map(record => [
      record.userId,
      record.name,
      record.date,
      record.checkinTime,
      record.checkoutTime,
      record.verificationMode || "—"
    ]);

    if (tableData.length > 0) {
      autoTable(doc, {
        head: [['User ID', 'Name', 'Date', 'Check-In', 'Check-Out', 'Verification']],
        body: tableData,
        startY: 50,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 11 },
        bodyStyles: { fontSize: 10, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(12);
      doc.text("No records found for the selected date range.", 14, 50);
    }

    doc.save(`attendance_${dateRange.from}_to_${dateRange.to}.pdf`);
    setIsDropdownOpen(false);
  };

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-600 to-teal-500 p-6 rounded-xl shadow-xl transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Attendance Dashboard
          </h1>
          <p className="text-blue-100 text-base opacity-90">
            Monitor employee attendance and check-in/check-out times
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-[180px]">
            <label htmlFor="date-picker" className="sr-only">Select date</label>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-10 bg-white/95 border-none focus:ring-2 focus:ring-blue-300 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-200 hover:bg-white"
              aria-label="Select date"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => onDateChange(today)}
            className="bg-white/95 text-gray-800 border-none hover:bg-white hover:text-blue-700 transition-all duration-200 rounded-lg font-medium"
            aria-label="Reset to today"
          >
            Today
          </Button>
          <div className="relative" ref={dropdownRef}>
            <Button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white/95 text-gray-800 hover:bg-white hover:text-blue-700 transition-all duration-200 rounded-lg flex items-center gap-2 font-medium relative group"
              aria-label="Download attendance report"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
            >
              <Download className="h-4 w-4" />
              Download PDF
              <span className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2">
                Download attendance summary
              </span>
            </Button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-20 animate-fadeIn">
                <ul className="py-1">
                  <li>
                    <button
                      onClick={generateFullPDF}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 text-sm font-medium"
                      aria-label="Download full attendance report"
                    >
                      Full Download
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={generateFilteredPDF}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 text-sm font-medium"
                      aria-label="Download attendance report for selected date range"
                    >
                      Calendar Selected
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;