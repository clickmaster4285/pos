'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Download,
  Search,
  MoreVertical,
  Plus,
  Trash2,
  Filter as FilterIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShoppingCart,
  Loader,
  Package,
} from 'lucide-react';
import BillingSummaryPDF from './BillingSummaryPDF'; // Import the BillingSummaryPDF component
export function Header({ onCreate }) {
  return (
    <header className="bg-card">
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mt-4 font-medium text-foreground">
              Billing Management
            </h1>
            <p className="text-sm text-muted-foreground">
              View all bills and create new ones
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Bill
            </Button>
            <BillingSummaryPDF /> {/* Rendered as a standalone component */}
          </div>
        </div>
      </div>
    </header>
  );
}

export function StatsCards({ summary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Bills
              </p>
              <p className="text-2xl font-bold text-foreground">
                {summary.total}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-2xl font-bold text-foreground">
                {summary.paid}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Refunded
              </p>
              <p className="text-2xl font-bold text-foreground">
                {summary.refunded}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Today&apos;s Revenue
              </p>
              <p className="text-2xl font-bold text-foreground">
                ${Number(summary.todayRevenue || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function FilterBar({
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
}) {
  const statuses = ['all', 'paid', 'refunded'];

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            placeholder="Search bills by number, buyer, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all duration-300"
          />
        </div>

        {/* Filter button + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="hover:bg-primary/10 transition-all duration-300"
            >
              <FilterIcon className="mr-2 h-4 w-4 text-primary" />
              Filter
              {filterStatus && filterStatus !== 'all' ? (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {filterStatus[0].toUpperCase() + filterStatus.slice(1)}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filterStatus}
              onValueChange={(val) => setFilterStatus(val)}
            >
              {statuses.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            {/* Optional: quick clear */}
            {filterStatus !== 'all' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  Clear filter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}