// attendance.jsx
'use client';

import { useState, useMemo } from "react";
import AttendanceHeader from "./AttendanceHeader";
import AttendanceTable from "./AttendanceTable";
import { useGetAllAttendanceQuery } from '@/features/attendanceApi';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Filter, X } from "lucide-react";
import { formatTime, formatDate } from '@/utils/dateUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Attendance = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateRange, setDateRange] = useState({ from: today, to: today });
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateError, setDateError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useGetAllAttendanceQuery();

  // Extract unique users for dropdown
  const uniqueUsers = useMemo(() => {
    if (!data?.data) return [];
    const users = {};
    data.data.forEach(record => {
      if (record.userId && record.userName) {
        users[record.userId] = record.userName;
      }
    });
    return Object.entries(users).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Process records
  const rawRecords = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return [];
    return data.data.filter(record => 
      record.userId && record.userName && record.checkTime && record.type
    );
  }, [data]);

  const filteredRecords = useMemo(() => {
    return rawRecords.filter((record) => {
      const recordDate = formatDate(record.checkTime);
      const withinDateRange = recordDate >= dateRange.from && recordDate <= dateRange.to;
      
      if (filterType === 'user' && selectedUser) {
        return withinDateRange && record.userId === selectedUser;
      }
      return withinDateRange;
    });
  }, [rawRecords, dateRange, filterType, selectedUser]);

  const groupedRecords = useMemo(() => {
    return filteredRecords.reduce((acc, record) => {
      const userId = record.userId;
      const date = formatDate(record.checkTime);
      const key = `${userId}_${date}`;
      
      if (!acc[key]) {
        acc[key] = {
          userId,
          name: record.userName,
          date,
          checkinTime: null,
          checkoutTime: null,
          verificationMode: record.verificationMode,
          latestTime: new Date(record.checkTime),
          records: [],
        };
      }
      
      acc[key].records.push({
        ...record,
        formattedTime: formatTime(record.checkTime),
        formattedType: record.type === 'checkin' ? 'Check In' : 'Check Out',
      });

      if (record.type === 'checkin') {
        const time = new Date(record.checkTime);
        if (!acc[key].checkinTime || time < new Date(acc[key].checkinTime)) {
          acc[key].checkinTime = record.checkTime;
        }
      } else if (record.type === 'checkout') {
        const time = new Date(record.checkTime);
        if (!acc[key].checkoutTime || time > new Date(acc[key].checkoutTime)) {
          acc[key].checkoutTime = record.checkTime;
        }
      }
      
      const currentTime = new Date(record.checkTime);
      if (currentTime > acc[key].latestTime) {
        acc[key].latestTime = currentTime;
        acc[key].verificationMode = record.verificationMode;
      }
      
      return acc;
    }, {});
  }, [filteredRecords]);

  const processedGroups = useMemo(() => {
    return Object.values(groupedRecords).map((group, index) => ({
      id: index,
      userId: group.userId,
      name: group.name,
      date: group.date,
      checkinTime: group.checkinTime ? formatTime(group.checkinTime) : '—',
      checkoutTime: group.checkoutTime ? formatTime(group.checkoutTime) : '—',
      verificationMode: group.verificationMode || '—',
      rawRecords: group.records,
    }));
  }, [groupedRecords]);

  const handleDateRangeChange = (newRange) => {
    const { from, to } = newRange;
    if (from && to && new Date(to) < new Date(from)) {
      setDateError('End date cannot be before start date');
      return;
    }
    setDateError('');
    setDateRange(newRange);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    handleDateRangeChange({ from: date, to: date });
  };

  const resetFilters = () => {
    setDateRange({ from: today, to: today });
    setSelectedDate(today);
    setFilterType('all');
    setSelectedUser('');
    setDateError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-600 font-medium">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
  //       <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
  //         <p className="text-red-600 font-medium mb-4">
  //           Failed to fetch attendance records
  //         </p>
  //         <Button
  //           onClick={() => refetch()}
  //           className="bg-blue-500 hover:bg-blue-600 text-white transition-colors"
  //         >
  //           Retry
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <AttendanceHeader 
          selectedDate={selectedDate} 
          onDateChange={handleDateChange}
          records={processedGroups}
          dateRange={dateRange}
        />
        
        {/* Modern Filter Section */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="flex space-x-2">

                {/* Filter Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Filter Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="user">By User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Selector */}
                {filterType === 'user' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Select User</label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="bg-white border-slate-300">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date Range</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => handleDateRangeChange({ ...dateRange, from: e.target.value })}
                        className={`pl-10 bg-white border-slate-300 ${dateError ? 'border-red-300' : ''}`}
                      />
                    </div>
                    <span className="self-center text-slate-500">to</span>
                    <div className="flex-1 relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => handleDateRangeChange({ ...dateRange, to: e.target.value })}
                        className={`pl-10 bg-white border-slate-300 ${dateError ? 'border-red-300' : ''}`}
                      />
                    </div>
                  </div>
                  {dateError && (
                    <p className="text-red-500 text-sm">{dateError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <AttendanceTable records={processedGroups} rawRecords={rawRecords} />
      </div>
    </div>
  );
};

export default Attendance;