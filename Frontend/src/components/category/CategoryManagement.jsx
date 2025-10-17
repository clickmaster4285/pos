"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Calendar, Filter } from "lucide-react";

import { CategoryModal } from "./CategoryModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CategoryGrid } from "./CategoryGrid";
import { CategoryList } from "./CategoryList";
import { CategoryDetailsSheet } from "./CategoryDetailsSheet";
import Pagination from "@/components/ui/Pagination";

import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useToggleCategoryStatusMutation,
} from "@/features/categoryApi";

// ---- helpers -------------------------------------------------
const getId = (c) => String(c?.id ?? c?._id ?? "").trim();

const norm = (s) => (typeof s === "string" ? s : "");


function normalizeCategory(c) {
  return {
    id: getId(c),
    categoryName: norm(c?.categoryName),
    description: norm(c?.description),
    subCategory: Array.isArray(c?.subCategory) ? c.subCategory : [],
    tags: Array.isArray(c?.tags) ? c.tags : [],
    createdAt: c?.createdAt || null,
    updatedAt: c?.updatedAt || null,
  };
}

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
function getCategoryDate(c) {
  const raw = c?.createdAt || c?.updatedAt || c?.date;
  return raw ? new Date(raw) : null;
}
function getCategoryStatus(c) {
  const s = (c?.status || "").toLowerCase();
  if (s === "active" || c?.isActive) return "active";
  if (s === "inactive" || c?.isActive === false) return "inactive";
  return "inactive";
}

export function CategoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quickRange, setQuickRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit" | "view"
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    categoryId: null,
  });
  const [pendingId, setPendingId] = useState(null);
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsCategory, setDetailsCategory] = useState(null);

  // Compute quick date range
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    switch (quickRange) {
      case "today":
        return { fromDate: todayStart, toDate: todayEnd };
      case "yesterday": {
        const y = addDays(todayStart, -1);
        return { fromDate: startOfDay(y), toDate: endOfDay(y) };
      }
      case "last7":
        return {
          fromDate: startOfDay(addDays(todayStart, -6)),
          toDate: todayEnd,
        };
      case "last30":
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
    data: categories = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();
  const [toggleStatus, { isLoading: toggling }] =
    useToggleCategoryStatusMutation();

  // Search and filter
  const filteredCategories = useMemo(() => {
    let list = categories;

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((c) => {
        const name = norm(c?.categoryName).toLowerCase();
        const description = norm(c?.description).toLowerCase();
        const idStr = getId(c).toLowerCase();
        return name.includes(q) || description.includes(q) || idStr.includes(q);
      });
    }

    // Date filter
    if (fromDate || toDate) {
      list = list.filter((c) => {
        const d = getCategoryDate(c);
        if (!d || isNaN(d.getTime())) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((c) => getCategoryStatus(c) === statusFilter);
    }

    return list;
  }, [categories, searchTerm, fromDate, toDate, statusFilter]);

  // Paginate
  const total = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  // Actions
  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(normalizeCategory(category));
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(normalizeCategory(category));
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (cOrId) => {
    const id = typeof cOrId === "string" ? cOrId.trim() : getId(cOrId);
    if (!id) return console.error("No valid id passed to handleDeleteCategory");
    setDeleteDialog({ open: true, categoryId: id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.categoryId) {
      console.error("No categoryId in dialog — aborting delete");
      return;
    }
    try {
      await deleteCategory(deleteDialog.categoryId).unwrap();
    } catch (e) {
      console.error("Failed to delete category:", e);
    } finally {
      setDeleteDialog({ open: false, categoryId: null });
    }
  };

  const handleToggle = async (category) => {
    const id = getId(category);
    try {
      setPendingId(id);
      await toggleStatus(id).unwrap();
    } catch (e) {
      console.error("Toggle status failed:", e);
    } finally {
      setPendingId(null);
    }
  };

  const handleSaveCategory = async (formData) => {
    try {
      if (modalMode === "create") {
        await createCategory({
          ...formData,
          subCategory: formData.subCategory,
          tags: formData.tags,
        }).unwrap();
      } else if (modalMode === "edit") {
        await updateCategory({
          id: formData.id,
          ...formData,
          subCategory: formData.subCategory,
          tags: formData.tags,
        }).unwrap();
      }
      setIsModalOpen(false);
      refetch();
    } catch (e) {
      console.error("Failed to save category:", e);
    }
  };

  const openCategoryDetailsSheet = (category) => {
    setDetailsCategory(normalizeCategory(category));
    setIsDetailsOpen(true);
  };

  // Basic loading/error UI
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading categories…
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load categories.
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
                Category Management
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage automotive part categories
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={view === "grid" ? "default" : "secondary"}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "secondary"}
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleCreateCategory}
                className="gap-2"
                disabled={creating || updating}
                variant={"header"}
              >
                <Plus className="h-4 w-4" />
                Add Category
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
                placeholder="Search categories by name, description, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10 border-border focus:ring-ring"
              />
            </div>
          </div>
          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {quickRange === "all"
                  ? "All dates"
                  : quickRange === "today"
                  ? "Today"
                  : quickRange === "yesterday"
                  ? "Yesterday"
                  : quickRange === "last7"
                  ? "Last 7 days"
                  : "Last 30 days"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 ">
              <DropdownMenuItem onClick={() => setQuickRange("all")}>
                All dates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange("today")}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange("yesterday")}>
                Yesterday
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange("last7")}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickRange("last30")}>
                Last 30 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4 text-primary" />
                {statusFilter === "all"
                  ? "All statuses"
                  : statusFilter === "active"
                  ? "Active"
                  : "Inactive"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {view === "grid" ? (
          <CategoryGrid
            categories={paginatedCategories}
            onView={handleViewCategory}
            onEdit={handleEditCategory}
            handleToggle={handleToggle}
            pendingId={pendingId}
            onDelete={(c) => handleDeleteCategory(getId(c))}
            onOpenSheet={openCategoryDetailsSheet}
          />
        ) : (
          <div className="mb-6">
            <CategoryList
              categories={paginatedCategories}
              onView={handleViewCategory}
              onEdit={handleEditCategory}
              handleToggle={handleToggle}
              pendingId={pendingId}
              onDelete={(c) => handleDeleteCategory(getId(c))}
              onOpenSheet={openCategoryDetailsSheet}
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
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
        mode={modalMode}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, categoryId: null })}
        onConfirm={confirmDelete}
        categoryName={
          categories.find((c) => getId(c) === deleteDialog.categoryId)
            ?.categoryName
        }
        loading={deleting}
      />

      <CategoryDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        category={detailsCategory}
      />
    </div>
  );
}
