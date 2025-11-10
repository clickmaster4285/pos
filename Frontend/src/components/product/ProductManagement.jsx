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
import { getProductFields } from '@/utils/industryFields';

const getId = (p) => String(p?.id ?? p?._id ?? '').trim();
const norm = (s) => (typeof s === 'string' ? s : '');

function normalizeProduct(p, hasCategories, hasVendors) {
  return {
    id: getId(p),
    productName: norm(p?.productName),
    category: hasCategories ? p?.categoryName : '',

    subCategoryName: hasCategories ? norm(p?.subCategoryName) : '',
    vendor: hasVendors ? p?.vendorName : '-',
    SKU: norm(p?.SKU),
    sellingPrice: p?.sellingPrice || 0,
    quantity: p?.quantity || 0,
    description: norm(p?.description),
    tags: Array.isArray(p?.tags) ? p.tags : [],
    isActive: !!p?.isActive,
    createdAt: p?.createdAt || null,
    updatedAt: p?.updatedAt || null,
    imgUrl: Array.isArray(p?.imgUrl) ? p.imgUrl : p?.imgUrl ? [p.imgUrl] : [],
    metaData: p?.metaData || {},
    ingredient: (p?.ingredient || []).map((ing) => ({
      ingredientId: ing.ingredientId?._id || ing.ingredientId,
      ingredientName: ing.ingredientName,
      quantity: ing.quantity,
    })),
  };
}

export function ProductManagement() {
  const user = useSelector((state) => state.auth.user);
  const hasVendorsFeature = () => (user?.extraFeature || []).includes('Vendors');
  const hasCategoriesFeature = () => (user?.extraFeature || []).includes('Category');

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorData,
    refetch,
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
  const [toggleProductStatus, { isLoading: toggling }] = useToggleProductStatusMutation();
  const [updateProductStock, { isLoading: updatingStock }] = useUpdateProductStockMutation();

  const products = useMemo(() => {
    return (productsResponse?.data || []).map((p) =>
      normalizeProduct(p, hasCategoriesFeature(), hasVendorsFeature())
    );
  }, [productsResponse]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(term) ||
          p.SKU.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => (statusFilter === 'active' ? p.isActive : !p.isActive));
    }

    return filtered;
  }, [products, searchTerm, statusFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const total = filteredProducts.length;

  const handleCreateProduct = () => {
    setModalMode('create');
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleViewProduct = (product) => {
    setDetailsProduct(product);
    setIsDetailsOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setDeleteDialog({
      open: true,
      productId: getId(product),
      productName: product.productName,
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteDialog.productId).unwrap();
      setDeleteDialog({ open: false, productId: null, productName: '' });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleToggle = async (product) => {
    const id = getId(product);
    setPendingId(id);
    try {
      await toggleProductStatus(id).unwrap();
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setPendingId(null);
    }
  };

  // FIXED: Accept FormData directly — no rebuild
  const handleSaveProduct = async (formData) => {
    try {
      if (modalMode === 'create') {
        await createProduct(formData).unwrap();
      } else {
        await updateProduct({ id: getId(selectedProduct), formData }).unwrap();
      }
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Save failed:', err);
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={handleCreateProduct} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border"
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'all'
                ? 'All Status'
                : statusFilter === 'active'
                ? 'Active'
                : 'Inactive'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={view === 'grid' ? 'default' : 'outline'}
          onClick={() => setView('grid')}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          onClick={() => setView('list')}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">List</span>
        </Button>
      </div>

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
              hasVendors={hasVendorsFeature}
              hasCategories={hasCategoriesFeature}
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
              hasVendors={hasVendorsFeature}
              hasCategories={hasCategoriesFeature}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, total)} of {total} products
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
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
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
        onClose={() => {
          setIsStockModalOpen(false);
          setStockProduct(null);
        }}
        onSave={handleSaveStock}
        products={productsResponse?.data || []}
        selectedProduct={stockProduct}
        isLoading={updatingStock}
      />
    </div>
  );
}