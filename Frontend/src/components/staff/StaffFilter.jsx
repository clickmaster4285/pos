'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

// shadcn dropdown (uses your Button as the trigger)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StaffFilter = ({
  searchTerm,
  setSearchTerm,

  // NEW props
  departmentFilter,
  setDepartmentFilter,
  roleFilter,
  setRoleFilter,

  // Lists to show in the menus
  departments = [],
  roles = [],
}) => {
  return (
    <div className="">
      <div className="">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="Search staff by name, email, role, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all duration-300"
            />
          </div>

          {/* Department filter (button looks the same) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="hover:bg-primary/10 transition-all duration-300"
              >
                <Filter className="mr-2 h-4 w-4 text-primary" />
                Filter by Department
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Department</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={departmentFilter}
                onValueChange={(v) => setDepartmentFilter(v)}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                {departments.map((d) => (
                  <DropdownMenuRadioItem key={d} value={d.toLowerCase()}>
                    {d}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Role filter (button looks the same) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="hover:bg-primary/10 transition-all duration-300"
              >
                <Filter className="mr-2 h-4 w-4 text-primary" />
                Filter by Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v)}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                {roles.map((r) => (
                  <DropdownMenuRadioItem key={r} value={r.toLowerCase()}>
                    {r}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default StaffFilter;
