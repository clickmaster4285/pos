'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const normalize = (s) =>
  String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const titleCase = (s) =>
  String(s || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

export default function SearchFilters({
  search,
  onSearchChange,
  department, // will be normalized key or null
  onDepartmentChange, // (normalizedKey|null) => void
  apiUsers = [],
  onCompanySummary,
  viewCompanySummaryPermission,
}) {
  // unique, normalized options
  const deptOptions = useMemo(() => {
    const map = new Map(); // key: normalized dept, val: label
    for (const u of apiUsers) {
      const raw = String(u?.department || '');
      const key = normalize(raw);
      if (!key) continue;
      if (!map.has(key)) map.set(key, titleCase(raw));
    }
    // return [{ value, label }]
    return Array.from(map, ([value, label]) => ({ value, label })).sort(
      (a, b) => a.label.localeCompare(b.label)
    );
  }, [apiUsers]);

  const selectValue = department ?? '__ALL__';

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, role and department"
            className="pl-9 bg-background w-full"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select
          value={selectValue}
          onValueChange={(val) =>
            onDepartmentChange(val === '__ALL__' ? null : val)
          }
        >
          <SelectTrigger className="w-[200px] shrink-0 bg-background">
            <SelectValue placeholder="Filter dept." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">All departments</SelectItem>
            {deptOptions.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          className="shrink-0"
          onClick={() => onCompanySummary?.()}
          disabled={!viewCompanySummaryPermission}
        >
          <Filter className="h-4 w-4 mr-2" />
          Company Summary
        </Button>
      </div>
    </div>
  );
}
