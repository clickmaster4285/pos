// AttendanceHeader.jsx
'use client';

import { useState, useRef } from "react";
import { Calendar, Download, TrendingUp, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceHeader = ({ selectedDate, onDateChange, records, dateRange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  // Calculate stats
  const stats = {
    total: records.length,
    present: records.filter(r => r.checkinTime !== '—' && r.checkoutTime !== '—').length,
    partial: records.filter(r => (r.checkinTime !== '—' && r.checkoutTime === '—') || 
                                (r.checkinTime === '—' && r.checkoutTime !== '—')).length,
  };

  const generateFullPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Attendance Summary Report", 14, 25);
    
    // Subheader
    doc.setFontSize(12);
    doc.text("Full Report", 14, 35);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 42);

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
      theme: 'grid',
      headStyles: { 
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`attendance_full_${today}.pdf`);
    setIsDropdownOpen(false);
  };

  const generateFilteredPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Attendance Summary Report", 14, 25);
    
    // Subheader
    doc.setFontSize(12);
    doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 14, 35);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 42);

    const tableData = records.map(record => [
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
        theme: 'grid',
        headStyles: { 
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text("No records found for the selected date range.", 14, 50);
    }

    doc.save(`attendance_${dateRange.from}_to_${dateRange.to}.pdf`);
    setIsDropdownOpen(false);
  };

  return (
    <div className="mb-8">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl shadow-xl mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Attendance Dashboard
            </h1>
            <p className="text-slate-300 text-lg">
              Monitor and analyze employee attendance patterns
            </p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/20 focus:border-white/40 rounded-xl transition-all duration-200"
                aria-label="Select date"
              />
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/40 rounded-xl flex items-center gap-2 transition-all duration-200 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-20 animate-in fade-in-0 zoom-in-95">
                  <div className="p-2">
                    <button
                      onClick={generateFullPDF}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors duration-150 text-sm font-medium"
                    >
                      Full Report
                    </button>
                    <button
                      onClick={generateFilteredPDF}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors duration-150 text-sm font-medium"
                    >
                      Date Range Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Records</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Full Attendance</p>
              <p className="text-2xl font-bold text-slate-800">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Partial Records</p>
              <p className="text-2xl font-bold text-slate-800">{stats.partial}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;