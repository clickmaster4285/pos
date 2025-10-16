'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import WarehouseHeader from './warehouse-header';
import WarehouseTable from './warehouse-table';
import WarehouseForm from './warehouse-form';
import { DUMMY_WAREHOUSE_DATA } from './dummy-data';
import Pagination from '../ui/Pagination';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export default function WarehouseModule() {
  const [items, setItems] = useState(DUMMY_WAREHOUSE_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Date filter state (quick ranges)
  const [quickRange, setQuickRange] = useState('all'); // all | today | yesterday | last7 | last30

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Compute date bounds from quickRange
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    if (quickRange === 'today') {
      return { fromDate: todayStart, toDate: todayEnd };
    }
    if (quickRange === 'yesterday') {
      const y = addDays(todayStart, -1);
      return { fromDate: startOfDay(y), toDate: endOfDay(y) };
    }
    if (quickRange === 'last7') {
      return {
        fromDate: startOfDay(addDays(todayStart, -6)),
        toDate: todayEnd,
      };
    }
    if (quickRange === 'last30') {
      return {
        fromDate: startOfDay(addDays(todayStart, -29)),
        toDate: todayEnd,
      };
    }
    return { fromDate: null, toDate: null };
  }, [quickRange]);

  // Apply filters (search + date)
  const filteredItems = useMemo(() => {
    let list = items;

    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.partNumber.toLowerCase().includes(q) ||
          item.partName.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
      );
    }

    // Date range by lastRestocked (YYYY-MM-DD)
    if (fromDate || toDate) {
      list = list.filter((item) => {
        if (!item.lastRestocked) return false;
        const d = new Date(item.lastRestocked);
        if (Number.isNaN(d.getTime())) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    return list;
  }, [items, searchTerm, fromDate, toDate]);

  // Paginate AFTER filtering
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Handlers
  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSave = (formData) => {
    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id ? { ...item, ...formData } : item
        )
      );
    } else {
      const newItem = {
        ...formData,
        id: Date.now().toString(),
      };
      setItems([...items, newItem]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // Date quick filter apply
  const applyQuick = (key) => {
    setQuickRange(key);
    setPage(1);
  };

  const currentRangeLabel =
    quickRange === 'all'
      ? 'All Dates'
      : quickRange === 'today'
      ? 'Today'
      : quickRange === 'yesterday'
      ? 'Yesterday'
      : quickRange === 'last7'
      ? 'Last 7 days'
      : 'Last 30 days';

  return (
    <div className="min-h-screen">
      <div className="flex justify-between">
        <WarehouseHeader />
        <Button
          onClick={handleAddNew}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-12"
        >
          <Plus className="h-5 w-5" />
          Add New Part
        </Button>
      </div>

      <div className="mx-auto px-4 pb-8">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border p-6">
            <div className="text-sm text-muted-foreground">Total Parts</div>
            <div className="mt-2 text-3xl font-bold text-foreground">
              {items.length}
            </div>
          </Card>
          <Card className="bg-card border-border p-6">
            <div className="text-sm text-muted-foreground">Low Stock Items</div>
            <div className="mt-2 text-3xl font-bold">
              {
                items.filter((item) => item.quantity > 0 && item.quantity < 50)
                  .length
              }
            </div>
          </Card>
          <Card className="bg-card border-border p-6">
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="mt-2 text-3xl font-bold text-foreground">
              $
              {items
                .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                .toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Search + Date Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-4">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by part number, name, or location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground w-full"
            />
          </div>

          {/* Date Filter */}
          <div className="mt-3 sm:mt-0 ">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <Calendar className="h-4 w-4" />
                  {currentRangeLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => applyQuick('all')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyQuick('today')}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyQuick('yesterday')}>
                  Yesterday
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyQuick('last7')}>
                  Last 7 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyQuick('last30')}>
                  Last 30 days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Section */}
        <Card className="bg-card border-border overflow-hidden">
          <WarehouseTable
            items={pagedItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>

        {/* Pagination (reusable component) */}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) =>
            setPage(
              Math.min(Math.max(1, p), Math.max(1, Math.ceil(total / pageSize)))
            )
          }
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          className="mx-auto"
        />

        {/* Form Modal */}
        {isFormOpen && (
          <WarehouseForm
            item={editingItem}
            onSave={handleSave}
            onClose={handleCloseForm}
          />
        )}
      </div>
    </div>
  );
}
