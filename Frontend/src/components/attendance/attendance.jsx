'use client';

import { useState } from "react";
import  AttendanceHeader  from "./AttendanceHeader";
import  AttendanceSummary  from "./AttendanceSummary";
import  AttendanceTable  from "./AttendanceTable";

const mockAttendanceData = [
  {
    id: "1",
    employeeId: "EMP001",
    name: "Sarah Johnson",
    checkIn: "08:45 AM",
    checkOut: "05:30 PM",
    status: "present",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "2",
    employeeId: "EMP002",
    name: "Michael Chen",
    checkIn: "09:15 AM",
    checkOut: "05:45 PM",
    status: "late",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "3",
    employeeId: "EMP003",
    name: "Emily Davis",
    checkIn: "08:30 AM",
    checkOut: "05:15 PM",
    status: "present",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "4",
    employeeId: "EMP004",
    name: "James Wilson",
    checkIn: null,
    checkOut: null,
    status: "absent",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "5",
    employeeId: "EMP005",
    name: "Lisa Anderson",
    checkIn: "08:50 AM",
    checkOut: "01:00 PM",
    status: "half-day",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "6",
    employeeId: "EMP006",
    name: "David Martinez",
    checkIn: "08:35 AM",
    checkOut: "05:20 PM",
    status: "present",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "7",
    employeeId: "EMP007",
    name: "Jennifer Taylor",
    checkIn: "09:20 AM",
    checkOut: "05:50 PM",
    status: "late",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "8",
    employeeId: "EMP008",
    name: "Robert Brown",
    checkIn: "08:40 AM",
    checkOut: "05:25 PM",
    status: "present",
    date: new Date().toISOString().split("T")[0],
  },
];

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const total = mockAttendanceData.length;
  const present = mockAttendanceData.filter((r) => r.status === "present").length;
  const absent = mockAttendanceData.filter((r) => r.status === "absent").length;
  const late = mockAttendanceData.filter((r) => r.status === "late").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AttendanceHeader 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />
        
        <AttendanceSummary 
          total={total}
          present={present}
          absent={absent}
          late={late}
        />
        
        <AttendanceTable records={mockAttendanceData} />
      </div>
    </div>
  );
};

export default Attendance;