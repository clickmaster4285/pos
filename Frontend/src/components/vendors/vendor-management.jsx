'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  Search,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Calendar, Filter } from 'lucide-react';

import { VendorModal } from './vendor-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { VendorGrid } from './vendor-grid';
import { VendorList } from './vendor-list';
import { VendorDetailsSheet } from './vendor-details-sheet'; // adjust path
import Pagination from '@/components/ui/Pagination';

import {
  useGetAllVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useToggleVendorStatusMutation,
} from '@/features/vendorApi';

// ---- helpers -------------------------------------------------
const getId = (v) => String(v?.id ?? v?._id ?? v?.vendorId ?? '').trim();

const norm = (s) => (typeof s === 'string' ? s : '');

function normalizeVendor(v) {
  return {
    id: getId(v),
    name: norm(v?.name),
    email: norm(v?.email),
    phone: norm(v?.phone),
    address: norm(v?.address),
    contactName: norm(v?.contactName),
    paymentType: norm(v?.paymentType),
  };
}

export function VendorManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  //
  const [quickRange, setQuickRange] = useState('all'); //
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // "create" | "edit" | "view"
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    vendorId: null,
  });
  const [pendingId, setPendingId] = useState(null);
  const [view, setView] = useState('grid'); // "grid" | "list"
  const itemsPerPage = 12;
  // --- date helpers ---
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
  function getVendorDate(v) {
    const raw = v?.createdAt || v?.updatedAt || v?.joinedAt || v?.date;
    return raw ? new Date(raw) : null;
  }
  function getVendorStatus(v) {
    const s = (v?.status || '').toLowerCase();
    if (s === 'active' || v?.isActive) return 'active';
    if (s === 'inactive' || v?.isActive === false) return 'inactive';
    return 'inactive';
  }

  // Compute quick date range
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    switch (quickRange) {
      case 'today':
        return { fromDate: todayStart, toDate: todayEnd };
      case 'yesterday': {
        const y = addDays(todayStart, -1);
        return { fromDate: startOfDay(y), toDate: endOfDay(y) };
      }
      case 'last7':
        return {
          fromDate: startOfDay(addDays(todayStart, -6)),
          toDate: todayEnd,
        };
      case 'last30':
        return {
          fromDate: startOfDay(addDays(todayStart, -29)),
          toDate: todayEnd,
        };
      default:
        return { fromDate: null, toDate: null };
    }
  }, [quickRange]);

  // RTK Query hooks
  const {
    data: vendors = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllVendorsQuery();

  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();
  const [deleteVendor, { isLoading: deleting }] = useDeleteVendorMutation();
  const [toggleStatus, { isLoading: toggling }] =
    useToggleVendorStatusMutation();
  // search
  const filteredVendors = useMemo(() => {
    let list = vendors;

    // search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((v) => {
        const name = norm(v?.name).toLowerCase();
        const email = norm(v?.email).toLowerCase();
        const category = norm(v?.category).toLowerCase();
        const idStr = getId(v).toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          category.includes(q) ||
          idStr.includes(q)
        );
      });
    }

    // date filter
    if (fromDate || toDate) {
      list = list.filter((v) => {
        const d = getVendorDate(v);
        if (!d || isNaN(d.getTime())) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    // status filter
    if (statusFilter !== 'all') {
      list = list.filter((v) => getVendorStatus(v) === statusFilter);
    }

    return list;
  }, [vendors, searchTerm, fromDate, toDate, statusFilter]);

  // paginate
  const total = filteredVendors.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedVendors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVendors.slice(start, start + pageSize);
  }, [filteredVendors, page, pageSize]);

  // actions
  const handleCreateVendor = () => {
    setSelectedVendor(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(normalizeVendor(vendor));
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewVendor = (vendor) => {
    setSelectedVendor(normalizeVendor(vendor));
    setModalMode('view');
    setIsModalOpen(true);
  };
  const handleDeleteVendor = (vOrId) => {
    const id = typeof vOrId === 'string' ? vOrId.trim() : getId(vOrId);

    if (!id) return console.error('No valid id passed to handleDeleteVendor');
    setDeleteDialog({ open: true, vendorId: id });
  };
  const confirmDelete = async () => {
    if (!deleteDialog.vendorId) {
      console.error('No vendorId in dialog — aborting delete');
      return;
    }
    try {
      await deleteVendor(deleteDialog.vendorId).unwrap();
    } catch (e) {
      console.error('Failed to delete vendor:', e);
    } finally {
      setDeleteDialog({ open: false, vendorId: null });
    }
  };

  const handleToggle = async (vendor) => {
    const id = getId(vendor);
    try {
      setPendingId(id);
      await toggleStatus(id).unwrap();
    } catch (e) {
      console.error('Toggle status failed:', e);
    } finally {
      setPendingId(null);
    }
  };

  // const confirmDelete = async () => {
  //   try {
  //     await deleteVendor(deleteDialog.vendorId).unwrap();
  //   } catch (e) {
  //     console.error('Failed to delete vendor:', e);
  //   } finally {
  //     setDeleteDialog({ open: false, vendorId: null });
  //   }
  // };

  const handleSaveVendor = async (formData) => {
    try {
      if (modalMode === 'create') {
        // send exactly what your backend expects
        await createVendor({
          name: formData.name,
          email: formData.email,
          contactName: formData.contactName,
          phone: formData.phone,
          address: formData.address,
          paymentType: formData.paymentType, // if you
        }).unwrap();
      } else if (modalMode === 'edit') {
        const id = formData.id;
        await updateVendor({
          id,
          name: formData.name,
          email: formData.email,
          contactName: formData.contactName,
          phone: formData.phone,
          address: formData.address,
          paymentType: formData.paymentType,
        }).unwrap();
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error('Save vendor failed:', e);
    }
  };

  //---------------------------
  // sheet-only state (separate from the modal flow)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsVendor, setDetailsVendor] = useState(null);

  // open the right-side sheet; do NOT touch your modal/view flow
  const openVendorDetailsSheet = (vendor) => {
    setDetailsVendor(vendor); // pass raw vendor (or normalize if you prefer)
    setIsDetailsOpen(true);
  };
  //-----------------------------------------

  // basic loading/error UI
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading vendors…</div>
    );
  }
  if (isError) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load vendors.
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className=" ">
        <div className="max-w-full mx-auto px-6 pt-6">
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-semibold text-foreground ">
                Vendor Management
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage automotive vendors and suppliers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={view === 'grid' ? 'default' : 'secondary'}
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'secondary'}
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleCreateVendor}
                className="gap-2"
                disabled={creating || updating}
                variant={'header'}
              >
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-full mx-auto px-6 py-6">
        {/* Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1 bg-card rounded-md ">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, email, category, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  setPage(1);
                }}
                className="pl-10 border-border focus:ring-ring"
              />
            </div>
          </div>
          {/* filters */}
          {/* Date filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {quickRange === 'all'
                  ? 'All dates'
                  : quickRange === 'today'
                  ? 'Today'
                  : quickRange === 'yesterday'
                  ? 'Yesterday'
                  : quickRange === 'last7'
                  ? 'Last 7 days'
                  : 'Last 30 days'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 ">
              <DropdownMenuItem onClick={() => setQuickRange('all')}>
                All dates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('today')}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('yesterday')}>
                Yesterday
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('last7')}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('last30')}>
                Last 30 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4 text-primary" />
                {statusFilter === 'all'
                  ? 'All statuses'
                  : statusFilter === 'active'
                  ? 'Active'
                  : 'Inactive'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {view === 'grid' ? (
          <VendorGrid
            vendors={paginatedVendors}
            onView={handleViewVendor}
            onEdit={handleEditVendor}
            handleToggle={handleToggle}
            pendingId={pendingId}
            onDelete={(v) => handleDeleteVendor(getId(v))}
            onOpenSheet={openVendorDetailsSheet}
          />
        ) : (
          <div className="mb-6">
            <VendorList
              vendors={paginatedVendors}
              onView={handleViewVendor}
              onEdit={handleEditVendor}
              handleToggle={handleToggle}
              pendingId={pendingId}
              onDelete={(v) => handleDeleteVendor(getId(v))}
              onOpenSheet={openVendorDetailsSheet}
            />
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) =>
            setPage(
              Math.min(Math.max(1, p), Math.max(1, Math.ceil(total / pageSize)))
            )
          }
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          siblingCount={1}
          boundaryCount={1}
        />
      </div>

      {/* Modals */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVendor}
        vendor={selectedVendor}
        mode={modalMode}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, vendorId: null })}
        onConfirm={confirmDelete}
        vendorName={
          vendors.find((v) => getId(v) === deleteDialog.vendorId)?.name
        }
        loading={deleting}
      />

      <VendorDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        vendor={detailsVendor}
      />
    </div>
  );
}
