'use client';

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Search,
  Filter,
  Settings,
  History,
  CheckCircle2,
  Users,
  Loader2,
} from 'lucide-react';

const isUserActive = (u) =>
  u?.isActive === true ||
  u?.isActive === 'true' ||
  u?.status?.isaccepted === true ||
  u?.status?.isaccepted === 'true';

export const PageHeader = () => (
  <div className="mb-8">
    <h1 className="text-3xl font-medium mt-4 text-foreground mb-2 text-balance">
      User Permissions Management
    </h1>
    <p className="text-muted-foreground text-lg">
      Manage user access and track permission changes across your automotive
      service platform
    </p>
  </div>
);

export const StatsCards = ({ isLoading, staff, activityLog }) => {
  const total = staff.length;
  const active = staff.filter(isUserActive).length;
  const admins = staff.filter(
    (u) => u.role === 'Administrator' || u.subRole === 'Administrator'
  ).length;

  const NumberOrLoader = ({ value }) =>
    isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{value}</>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">
                <NumberOrLoader value={total} />
              </CardTitle>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardDescription>Active Users</CardDescription>
              <CardTitle className="text-3xl">
                <NumberOrLoader value={active} />
              </CardTitle>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardDescription>Administrators</CardDescription>
              <CardTitle className="text-3xl">
                <NumberOrLoader value={admins} />
              </CardTitle>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardDescription>Recent Changes</CardDescription>
              <CardTitle className="text-3xl">{activityLog.length}</CardTitle>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};
export const FiltersBar = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  permissionFilter,
  setPermissionFilter,
  permissionLabels,
}) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
    <div className="flex gap-2">
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="w-[140px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="Administrator">Administrator</SelectItem>
          <SelectItem value="Manager">Manager</SelectItem>
          <SelectItem value="Supervisor">Supervisor</SelectItem>
          <SelectItem value="Staff">Staff</SelectItem>
        </SelectContent>
      </Select>
      <Select value={permissionFilter} onValueChange={setPermissionFilter}>
        <SelectTrigger className="w-[220px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Permission" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Permissions</SelectItem>
          {Object.entries(permissionLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);
