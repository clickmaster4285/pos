'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Plus, Search, Filter, Calendar, PackagePlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ProductModal } from './ProductModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ProductGrid } from './ProductGrid';
import { ProductList } from './ProductList';
import { ProductDetailsSheet } from './ProductDetailsSheet';
import { AddStockModal } from './AddStockModal';
import Pagination from '@/components/ui/Pagination';
import {
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleProductStatusMutation,
  useUpdateProductStockMutation,
} from '@/features/productApi';
import { useGetAllCategoriesQuery } from '@/features/categoryApi';
import { useGetAllVendorsQuery } from '@/features/vendorApi';
import { useGetAllIngredientsQuery } from '@/features/ingredientApi';

const getId = (p) => String(p?.id ?? p?._id ?? '').trim();
const norm = (s) => (typeof s === 'string' ? s : '');

function normalizeProduct(p, hasCategories, hasVendors) {
  return {
    id: getId(p),
    productName: norm(p?.productName),
    categoryName: hasCategories ? norm(p?.category) : '',
    subCategoryName: hasCategories ? norm(p?.subCategoryName) : '',
    vendor: hasVendors ? norm(p?.vendor) : '',
    SKU: norm(p?.SKU),
    sellingPrice: p?.sellingPrice || 0,
    costPrice: p?.costPrice || 0,
    quantity: p?.quantity || 0,
    description: norm(p?.description),
    tags: Array.isArray(p?.tags) ? p.tags : [],
    isActive: !!p?.isActive,
    createdAt: p?.createdAt || null,
    updatedAt: p?.updatedAt || null,
    ingredientNames: Array.isArray(p?.ingredient)
      ? p.ingredient.map(i => ({ ingredientName: norm(i.name) }))
      : [],
  };
}

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

function getProductDate(p) {
  const raw = p?.createdAt || p?.updatedAt || p?.date;
  return raw ? new Date(raw) : null;
}

export function ProductManagement() {
  const user = useSelector((state) => state.auth.user);

  const hasVendorsFeature = () => user?.extraFeature?.includes('Vendors') || false;
  const hasCategoriesFeature = () => user?.extraFeature?.includes('Category') || false;

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quickRange, setQuickRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null, productName: '' });
  const [pendingId, setPendingId] = useState(null);
  const [view, setView] = useState('grid');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);

  // === RTK QUERY HOOKS ===
  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorData,
  } = useGetAllProductsQuery();

  const { data: categories = [], isLoading: categoriesLoading } = hasCategoriesFeature()
    ? useGetAllCategoriesQuery()
    : { data: [], isLoading: false };

  const { data: vendors = [], isLoading: vendorsLoading } = hasVendorsFeature()
    ? useGetAllVendorsQuery()
    : { data: [], isLoading: false };

  const { data: ingredientsData } = useGetAllIngredientsQuery({ limit: 1000 });
  const ingredients = ingredientsData?.data || [];

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();
  const [toggleProductStatus] = useToggleProductStatusMutation();
  const [updateProductStock, { isLoading: updatingStock }] = useUpdateProductStockMutation();

  // === NORMALIZE & FILTER ===
  const filteredProducts = useMemo(() => {
    if (!productsResponse?.data) return [];

    let result = productsResponse.data.map((p) =>
      normalizeProduct(p, hasCategoriesFeature(), hasVendorsFeature())
    );

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(term) ||
          p.SKU.toLowerCase().includes(term) ||
          p.tags.some(t => t.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(p => p.isActive === isActive);
    }

    if (quickRange !== 'all') {
      const now = new Date();
      let start;
      switch (quickRange) {
        case 'today': start = startOfDay(now); break;
        case 'yesterday': start = startOfDay(addDays(now, -1)); break;
        case 'last7': start = startOfDay(addDays(now, -7)); break;
        case 'last30': start = startOfDay(addDays(now, -30)); break;
        default: start = null;
      }
      if (start) {
        result = result.filter(p => {
          const date = getProductDate(p);
          return date && date >= start;
        });
      }
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [productsResponse, searchTerm, statusFilter, quickRange]);

  const total = filteredProducts.length;
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  // === HANDLERS ===
  const handleSaveProduct = async (data) => {
    try {
      if (modalMode === 'create') {
        await createProduct(data).unwrap();
      } else {
        await updateProduct({ id: selectedProduct.id, ...data }).unwrap();
      }
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setDeleteDialog({ open: true, productId: product.id, productName: product.productName });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteDialog.productId).unwrap();
      setDeleteDialog({ open: false });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleToggle = async (product) => {
    setPendingId(product.id);
    try {
      await toggleProductStatus(product.id).unwrap();
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setPendingId(null);
    }
  };

  const openProductDetailsSheet = (product) => {
    setDetailsProduct(product);
    setIsDetailsOpen(true);
  };

  const handleAddStock = (product) => {
    setStockProduct(product);
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async (stockData) => {
    try {
      await updateProductStock({ stockData }).unwrap();
      setIsStockModalOpen(false);
      setStockProduct(null);
    } catch (err) {
      console.error('Stock update failed:', err);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button onClick={() => { setModalMode('create'); setIsModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Status: {statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" /> {quickRange === 'all' ? 'All Time' : quickRange}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setQuickRange('all')}>All Time</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('today')}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('yesterday')}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('last7')}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('last30')}>Last 30 Days</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant={view === 'grid' ? 'default' : 'outline'} onClick={() => setView('grid')} className="gap-2">
            <LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Grid</span>
          </Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')} className="gap-2">
            <List className="h-4 w-4" /><span className="hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      {/* Loading / Error / Data */}
      {productsLoading || categoriesLoading || vendorsLoading ? (
        <p className="text-center text-muted-foreground py-6">Loading...</p>
      ) : productsError ? (
        <div className="text-red-500 bg-red-50 p-4 rounded">
          <p>Failed to load products:</p>
          <pre>{JSON.stringify(productsErrorData, null, 2)}</pre>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <ProductGrid
              products={paginatedProducts}
              categories={categories}
              vendors={vendors}
              ingredients={ingredients}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              handleToggle={handleToggle}
              pendingId={pendingId}
              onOpenSheet={openProductDetailsSheet}
              onAddStock={handleAddStock}
            />
          ) : (
            <ProductList
              products={paginatedProducts}
              categories={categories}
              vendors={vendors}
              ingredients={ingredients}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              handleToggle={handleToggle}
              pendingId={pendingId}
              onOpenSheet={openProductDetailsSheet}
              onAddStock={handleAddStock}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} products
            </div>
            <Pagination
              page={page}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
        onSave={handleSaveProduct}
        product={selectedProduct}
        mode={modalMode}
        categories={hasCategoriesFeature() ? categories : []}
        vendors={hasVendorsFeature() ? vendors : []}
        ingredients={ingredients}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={confirmDelete}
        productName={deleteDialog.productName}
        isLoading={deleting}
      />

      <ProductDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        product={detailsProduct}
        categories={hasCategoriesFeature() ? categories : []}
        vendors={hasVendorsFeature() ? vendors : []}
        ingredients={ingredients}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onToggle={handleToggle}
        pending={pendingId === getId(detailsProduct)}
      />

      <AddStockModal
        isOpen={isStockModalOpen}
        onClose={() => { setIsStockModalOpen(false); setStockProduct(null); }}
        onSave={handleSaveStock}
        products={productsResponse?.data || []}
        selectedProduct={stockProduct}
        isLoading={updatingStock}
      />
    </div>
  );
}