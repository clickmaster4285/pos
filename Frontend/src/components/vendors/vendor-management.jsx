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

import { VendorModal } from './vendor-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { VendorGrid } from './vendor-grid';
import { VendorList } from './vendor-list';
import { VendorDetailsSheet } from './vendor-details-sheet'; // adjust path

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
  const [currentPage, setCurrentPage] = useState(1);
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
    if (!searchTerm) return vendors;

    const q = searchTerm.toLowerCase();
    return vendors.filter((v) => {
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
  }, [vendors, searchTerm]);

  // paginate
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(start, start + itemsPerPage);
  }, [filteredVendors, currentPage]);

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

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
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-full mx-auto px-6 py-6">
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
                variant={view === 'grid' ? 'default' : 'outline'}
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleCreateVendor}
                className="gap-2"
                disabled={creating || updating}
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
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, email, category, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 border-border focus:ring-ring"
              />
            </div>
          </div>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredVendors.length)} of{' '}
              {filteredVendors.length} vendors
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
