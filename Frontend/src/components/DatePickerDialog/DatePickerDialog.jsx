"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DatePickerDialog({
  open,
  onClose,
  onSubmit,
  initialFromDate = "",
  initialToDate = "",
}) {
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  const handleSubmit = () => {
    onSubmit(fromDate, toDate);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Date Range for PDF</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="fromDate"
              className="text-sm font-medium col-span-1"
            >
              From:
            </label>
            <input
              id="fromDate"
              type="date"
              className="col-span-3 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]} // prevents future date
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="toDate" className="text-sm font-medium col-span-1">
              To:
            </label>
            <input
              id="toDate"
              type="date"
              className="col-span-3 h-10 rounded-lg border border-gray-300 px-3 text-sm 
             focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
             dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || ""} // not less than fromDate
              max={new Date().toISOString().split("T")[0]} // prevents future date
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!fromDate && !toDate}>
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
