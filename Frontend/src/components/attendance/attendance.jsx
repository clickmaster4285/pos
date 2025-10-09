'use client';

import { useState, useMemo } from "react";
import AttendanceHeader from "./AttendanceHeader";
import AttendanceSummary from "./AttendanceSummary";
import AttendanceTable from "./AttendanceTable";
import { useGetAllAttendanceQuery } from '@/features/attendanceApi';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { formatTime, formatDate } from '@/utils/dateUtils';

const Attendance = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateRange, setDateRange] = useState({ from: today, to: today });
  const [filterType, setFilterType] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateError, setDateError] = useState('');

  const { data, isLoading, error, refetch } = useGetAllAttendanceQuery();

  // Extract and validate raw attendance records unconditionally
  const rawRecords = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) {
      return [];
    }
    return data.data.filter(record => 
      record.userId && record.userName && record.checkTime && record.type
    );
  }, [data]);

  // Define filteredRecords always, regardless of loading or error state
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((record) => {
      const recordDate = formatDate(record.checkTime);
      const withinDateRange = recordDate >= dateRange.from && recordDate <= dateRange.to;
      if (filterType === 'user' && userFilter) {
        return withinDateRange && record.userName?.toLowerCase().includes(userFilter.toLowerCase());
      }
      return withinDateRange;
    });
  }, [rawRecords, dateRange, filterType, userFilter]);

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

  const total = filteredRecords.length;
  const checkIns = filteredRecords.filter((r) => r.type === 'checkin').length;
  const checkOuts = filteredRecords.filter((r) => r.type === 'checkout').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium mb-4">
            Failed to fetch attendance records: {error.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="transition-colors hover:bg-muted"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AttendanceHeader 
          selectedDate={selectedDate} 
          onDateChange={handleDateChange}
          records={processedGroups}
          dateRange={dateRange}
        />
        
        <div className="mb-6 bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setFilterType('all');
                  setUserFilter('');
                }}
                className="transition-colors"
                aria-label="Show all records"
              >
                Show All
              </Button>
              <Button
                variant={filterType === 'user' ? 'default' : 'outline'}
                onClick={() => setFilterType('user')}
                className="transition-colors"
                aria-label="Filter by user"
              >
                By User
              </Button>
            </div>

            {filterType === 'user' && (
              <Input
                placeholder="Enter user name..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="max-w-xs bg-background border-border focus:ring-2 focus:ring-primary"
                aria-label="Filter by user name"
              />
            )}

            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => handleDateRangeChange({ ...dateRange, from: e.target.value })}
                  className={`pl-10 bg-background border-border max-w-[150px] focus:ring-2 focus:ring-primary ${dateError ? 'border-destructive' : ''}`}
                  aria-label="Select start date"
                />
              </div>
              <span className="text-muted-foreground font-medium">to</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => handleDateRangeChange({ ...dateRange, to: e.target.value })}
                  className={`pl-10 bg-background border-border max-w-[150px] focus:ring-2 focus:ring-primary ${dateError ? 'border-destructive' : ''}`}
                  aria-label="Select end date"
                />
              </div>
              {dateError && (
                <p className="text-destructive text-sm font-medium">{dateError}</p>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setDateRange({ from: today, to: today });
                  setSelectedDate(today);
                  setDateError('');
                }}
                className="transition-colors hover:bg-muted"
                aria-label="Reset date range"
              >
                Reset Dates
              </Button>
            </div>
          </div>
        </div>

        <AttendanceSummary 
          total={total} 
          checkIns={checkIns} 
          checkOuts={checkOuts} 
        />
        <AttendanceTable records={processedGroups} rawRecords={rawRecords} />
      </div>
    </div>
  );
};

export default Attendance;