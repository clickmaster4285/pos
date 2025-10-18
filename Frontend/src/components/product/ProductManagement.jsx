'use client';

import { useState, useMemo } from 'react';
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

const getId = (p) => String(p?.id ?? p?._id ?? '').trim();
const norm = (s) => (typeof s === 'string' ? s : '');

function normalizeProduct(p) {
  return {
    id: getId(p),
    productName: norm(p?.productName),
    categoryName: norm(p?.categoryName),
    subCategory: norm(p?.subCategory),
    vendor: norm(p?.vendor),
    SKU: norm(p?.SKU),
    sellingPrice: p?.sellingPrice || 0,
    costPrice: p?.costPrice || 0,
    quantity: p?.quantity || 0,
    location: norm(p?.location),
    condition: norm(p?.condition),
    attribute: Array.isArray(p?.attribute) ? p.attribute : [],
    customAttributes: Array.isArray(p?.customAttributes) ? p.customAttributes : [],
    description: norm(p?.description),
    tags: Array.isArray(p?.tags) ? p.tags : [],
    isActive: !!p?.isActive,
    createdAt: p?.createdAt || null,
    updatedAt: p?.updatedAt || null,
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

function getProductStatus(p) {
  const s = (p?.status || '').toLowerCase();
  if (s === 'active' || p?.isActive) return 'active';
  if (s === 'inactive' || p?.isActive === false) return 'inactive';
  return 'inactive';
}

export function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quickRange, setQuickRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null });
  const [pendingId, setPendingId] = useState(null);
  const [view, setView] = useState('grid');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);

  const { data: products = [], isLoading: productsLoading } = useGetAllProductsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useGetAllCategoriesQuery();
  const { data: vendors = [], isLoading: vendorsLoading } = useGetAllVendorsQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();
  const [toggleProductStatus] = useToggleProductStatusMutation();
  const [updateProductStock, { isLoading: updatingStock }] = useUpdateProductStockMutation();

  const filteredProducts = useMemo(() => {
    let result = products.map(normalizeProduct);
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(term) ||
          p.SKU.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => getProductStatus(p) === statusFilter);
    }
    if (quickRange !== 'all') {
      const { fromDate, toDate } = (() => {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        switch (quickRange) {
          case 'today':
            return { fromDate: todayStart, toDate: todayEnd };
          case 'yesterday':
            const y = addDays(todayStart, -1);
            return { fromDate: startOfDay(y), toDate: endOfDay(y) };
          case 'last7':
            return { fromDate: startOfDay(addDays(todayStart, -6)), toDate: todayEnd };
          case 'last30':
            return { fromDate: startOfDay(addDays(todayStart, -29)), toDate: todayEnd };
          default:
            return { fromDate: null, toDate: null };
        }
      })();
      if (fromDate && toDate) {
        result = result.filter((p) => {
          const date = getProductDate(p);
          return date && date >= fromDate && date <= toDate;
        });
      }
    }
    return result;
  }, [products, searchTerm, statusFilter, quickRange]);

  const total = filteredProducts.length;
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const handleSaveProduct = async (formData) => {
    try {
      const payload = {
        productName: formData.productName,
        categoryName: formData.categoryName,
        subCategory: formData.subCategory,
        vendor: formData.vendor,
        SKU: formData.SKU,
        sellingPrice: Number(formData.sellingPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        quantity: Number(formData.quantity) || 0,
        location: formData.location,
        condition: formData.condition,
        attribute: formData.attribute,
        customAttributes: formData.customAttributes,
        description: formData.description,
        tags: formData.tags,
      };
      if (modalMode === 'create') {
        await createProduct(payload).unwrap();
      } else {
        await updateProduct({ id: formData.id, ...payload }).unwrap();
      }
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEditProduct = (product) => {
    setModalMode('edit');
    setSelectedProduct(normalizeProduct(product));
    setIsModalOpen(true);
  };

    const handleViewProduct = (product) => {
    setSelectedProduct(normalizeProduct(product));
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setDeleteDialog({ open: true, productId: getId(product), productName: product.productName });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteDialog.productId).unwrap();
      setDeleteDialog({ open: false, productId: null });
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleToggle = async (product) => {
    setPendingId(getId(product));
    try {
      await toggleProductStatus(getId(product)).unwrap();
    } catch (error) {
      console.error('Error toggling product status:', error);
    } finally {
      setPendingId(null);
    }
  };

  const openProductDetailsSheet = (product) => {
    setDetailsProduct(normalizeProduct(product));
    setIsDetailsOpen(true);
  };

  const handleAddStock = (product) => {
    setStockProduct(product ? normalizeProduct(product) : null);
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async (stockData) => {
    try {
      setPendingId(stockData[0]?.productId); // Use first product ID for pending state
      await updateProductStock(stockData).unwrap();
      setIsStockModalOpen(false);
      setStockProduct(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      // Add toast notification or inline error here if desired
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setModalMode('create');
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
          <Button
            onClick={() => handleAddStock(null)}
            className="gap-2"
          >
            <PackagePlus className="h-4 w-4" /> Add Stock
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-border"
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" /> {quickRange === 'all' ? 'All Time' : quickRange}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setQuickRange('all')}>
                All Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('today')}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('yesterday')}>
                Yesterday
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('last7')}>
                Last 7 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange('last30')}>
                Last 30 Days
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
      </div>

      {productsLoading || categoriesLoading || vendorsLoading ? (
        <p className="text-center text-muted-foreground py-6">Loading...</p>
      ) : (
        <>
          {view === 'grid' ? (
            <ProductGrid
              products={paginatedProducts}
              categories={categories}
              vendors={vendors}
              onView={handleViewProduct}
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
              onView={handleViewProduct}
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
        categories={categories}
        vendors={vendors}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={confirmDelete}
        isLoading={deleting}
      />

      <ProductDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        product={detailsProduct}
        categories={categories}
        vendors={vendors}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onToggle={handleToggle}
        onAddStock={handleAddStock}
        pending={pendingId === getId(detailsProduct)}
      />

      <AddStockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockProduct(null);
        }}
        onSave={handleSaveStock}
        products={products}
        selectedProduct={stockProduct}
        isLoading={updatingStock}
      />
    </div>
  );
}