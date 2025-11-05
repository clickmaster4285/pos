'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Edit, Trash2, MoreVertical, PackagePlus, Image as ImageIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { ProductImageCarousel } from "./ProductImageCarousel";

const hasVendorsFeature = (user) => user?.extraFeature?.includes("Vendors") ?? false;

function getStatusVariant(status) {
  return status === "Active" ? "active" : "reject";
}

export function ProductList({
  products,
  categories,
  vendors,
  ingredients,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
  onAddStock,
}) {
  const user = useSelector((state) => state.auth.user);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!products?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">
        No products found.
      </p>
    );
  }

  const getVendorName = (vendorId) => {
    const vendor = vendors.find((v) => v._id === vendorId);
    return vendor?.vendorName || "—";
  };

  return (
    <Card className="divide-y border-border overflow-hidden">
      <div className={`grid ${hasVendorsFeature(user) ? "grid-cols-22" : "grid-cols-20"} items-center px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30`}>
        <div className="col-span-3 flex items-center gap-2"><span>Product</span></div>
        <div className="col-span-2">Category</div>
        {hasVendorsFeature(user) && <div className="col-span-2">Vendor</div>}
        <div className="col-span-3">Ingredients</div>
        <div className="col-span-2">SKU</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2">Details</div>
        <div className="col-span-2 text-center">Stock</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {products.map((p) => {
        const isPending = pendingId && pendingId === (p.id ?? p._id);
        const statusLabel = p.isActive ? "Active" : "Inactive";
        const hasImages = p.imgUrl && (Array.isArray(p.imgUrl) ? p.imgUrl.length > 0 : !!p.imgUrl);
        const meta = p.metaData || {};

        return (
          <div
            key={p.id ?? p._id}
            className={`grid ${hasVendorsFeature(user) ? "grid-cols-22" : "grid-cols-20"} items-center px-6 py-4 hover:bg-accent/20 transition-colors group`}
          >
            <div className="col-span-3 flex items-center gap-3 min-w-0" onClick={() => onOpenSheet(p)}>
              <div className="relative flex-shrink-0">
                {hasImages ? (
                  <ProductImageCarousel
                    imgUrls={p.imgUrl}
                    apiUrl={API_URL}
                    className="h-12 w-12 rounded-lg object-cover border shadow-sm"
                    alt={p.productName || "Product"}
                    showCounter={false}
                    showArrows={false}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-muted/50 border flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate leading-tight">{p.productName}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">{p.subCategoryName || "—"}</p>
              </div>
            </div>

            <div className="col-span-2" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-foreground truncate">{p.category || "—"}</p>
            </div>

            {hasVendorsFeature(user) && (
              <div className="col-span-2" onClick={() => onOpenSheet(p)}>
                <p className="text-sm text-foreground truncate">{getVendorName(p.vendor)}</p>
              </div>
            )}

            <div className="col-span-3" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-foreground line-clamp-2">
                {p.ingredient?.map(i => `${i.quantity} ${i.ingredientName}`).join(", ") || "—"}
              </p>
            </div>

            <div className="col-span-2" onClick={() => onOpenSheet(p)}>
              <p className="text-sm font-mono text-foreground truncate">{p.SKU || "—"}</p>
            </div>

            <div className="col-span-2" onClick={() => onOpenSheet(p)}>
              <p className="text-sm font-semibold text-green-600 truncate">
                ${p.sellingPrice?.toFixed(2) || "0.00"}
              </p>
            </div>
<div className="col-span-3" onClick={() => onOpenSheet(p)}>
  <p className="text-sm text-foreground line-clamp-2">
    {Object.entries(p.metaData || {})
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' • ') || '—'}
  </p>
</div>

            <div className="col-span-2 text-center" onClick={() => onOpenSheet(p)}>
              <p className="text-sm font-medium text-foreground">{p.quantity ?? 0}</p>
            </div>

            <div className="col-span-2 flex items-center justify-center">
              <Badge variant={getStatusVariant(statusLabel)} className="h-6 px-2 text-xs font-medium">
                {statusLabel}
              </Badge>
            </div>

            <div className="col-span-2">
              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button size="sm" variant="ghost" onClick={() => onEdit(p)} className="h-8 w-8 p-0 hover:bg-accent">
                  <Edit className="h-3.5 w-3.5" />
                </Button>

                <Button size="sm" variant="ghost" onClick={() => onDelete(p)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-accent">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <HoverCard openDelay={100} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <DropdownMenuItem className="cursor-default">Change Status</DropdownMenuItem>
                      </HoverCardTrigger>
                      <HoverCardContent side="left" align="start" className="w-64">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status</span>
                            <Switch checked={!!p.isActive} onCheckedChange={() => handleToggle?.(p)} disabled={!!isPending} />
                          </div>
                          <Button size="sm" className="w-full" onClick={() => handleToggle?.(p)} disabled={!!isPending}>
                            {isPending ? "Updating…" : p.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    <DropdownMenuItem onClick={() => onAddStock?.(p)}>
                      <PackagePlus className="mr-2 h-4 w-4" /> Add Stock
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}