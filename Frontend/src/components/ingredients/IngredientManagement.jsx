'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { IngredientModal } from './IngredientModal';
import { IngredientGrid } from './IngredientGrid';
import { IngredientList } from './IngredientList';
import { IngredientDetailsSheet } from './IngredientDetailsSheet';
import { AddIngredientStockModal } from './AddIngredientStockModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import {
  useGetAllIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
  useToggleIngredientStatusMutation,
  useUpdateIngredientStockMutation,
} from '@/features/ingredientApi';

export function IngredientManagement() {
  const user = useSelector((state) => state.auth.user);
  const industry = user?.industryName;

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [view] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, ingredientId: null, name: '' });
  const [pendingId, setPendingId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsIngredient, setDetailsIngredient] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockIngredient, setStockIngredient] = useState(null);

  const { data, isLoading } = useGetAllIngredientsQuery({ page, limit: pageSize });
  const [create] = useCreateIngredientMutation();
  const [update] = useUpdateIngredientMutation();
  const [remove] = useDeleteIngredientMutation();
  const [toggle] = useToggleIngredientStatusMutation();
  const [updateStock] = useUpdateIngredientStockMutation();

  const filtered = useMemo(() => {
    if (!data?.data) return [];
    const term = searchTerm.toLowerCase();
    return data.data.filter((i) =>
      i.name.toLowerCase().includes(term) || i.SKU.toLowerCase().includes(term)
    );
  }, [data?.data, searchTerm]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const openCreateModal = useCallback(() => {
    setModalMode('create');
    setSelectedIngredient(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((ing) => {
    setSelectedIngredient(ing);
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedIngredient(null);
      setModalMode('create');
    }, 300);
  }, []);

  const handleSave = useCallback(async (payload) => {
    try {
      if (modalMode === 'create') {
        await create(payload).unwrap();
      } else {
        await update({ id: selectedIngredient._id, ...payload }).unwrap();
      }
      closeModal();
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [modalMode, selectedIngredient, create, update, closeModal]);

  const openDeleteDialog = useCallback((ing) => {
    setDeleteDialog({ open: true, ingredientId: ing._id, name: ing.name });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteDialog.ingredientId) {
      await remove(deleteDialog.ingredientId).unwrap();
    }
    setDeleteDialog({ open: false, ingredientId: null, name: '' });
  }, [deleteDialog.ingredientId, remove]);

  const handleToggle = useCallback(async (ing) => {
    setPendingId(ing._id);
    try {
      await toggle(ing._id).unwrap();
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setPendingId(null);
    }
  }, [toggle]);

  const openDetails = useCallback((ing) => {
    setDetailsIngredient(ing);
    setIsDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setIsDetailsOpen(false);
    setDetailsIngredient(null);
  }, []);

  const openStockModal = useCallback((ing) => {
    setStockIngredient(ing);
    setIsStockModalOpen(true);
  }, []);

  const closeStockModal = useCallback(() => {
    setIsStockModalOpen(false);
    setStockIngredient(null);
  }, []);

  const saveStock = useCallback(async (stockData) => {
    try {
      await updateStock(stockData).unwrap();
      closeStockModal();
    } catch (err) {
      console.error('Stock update failed:', err);
    }
  }, [updateStock, closeStockModal]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p) => setPage(p), []);
  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ingredients</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add Ingredient
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <IngredientGrid
              ingredients={paginated}
              onEdit={openEditModal}
              onDelete={openDeleteDialog}
              handleToggle={handleToggle}
              pendingId={pendingId}
              onOpenSheet={openDetails}
              onAddStock={openStockModal}
            />
          ) : (
            <IngredientList
              ingredients={paginated}
              onEdit={openEditModal}
              onDelete={openDeleteDialog}
              handleToggle={handleToggle}
              pendingId={pendingId}
              onOpenSheet={openDetails}
              onAddStock={openStockModal}
            />
          )}
        </>
      )}

      <Pagination
        page={page}
        total={filtered.length}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <IngredientModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        ingredient={selectedIngredient}
        mode={modalMode}
        industry={industry}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={confirmDelete}
        productName={deleteDialog.name}
      />

      <IngredientDetailsSheet
        open={isDetailsOpen}
        onOpenChange={closeDetails}
        ingredient={detailsIngredient}
        onEdit={openEditModal}
        onDelete={openDeleteDialog}
        onToggle={handleToggle}
        pending={pendingId === detailsIngredient?._id}
      />

      <AddIngredientStockModal
        isOpen={isStockModalOpen}
        onClose={closeStockModal}
        onSave={saveStock}
        selectedIngredient={stockIngredient}
      />
    </div>
  );
}