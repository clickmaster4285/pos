'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { Switch } from '@/components/ui/switch';
import { Tag, Edit, Trash2, Calendar, MoreVertical, PackagePlus } from 'lucide-react';

const hasVendorsFeature = () => {
  const user = useSelector((state) => state.auth.user);
  if (user) {
    const parsedAuthState = user
    return parsedAuthState.extraFeature?.includes('Vendors') || false;
  }
  return false;
};

const hasCategoriesFeature = () => {
  const user = useSelector((state) => state.auth.user);
  if (user) {
    const parsedAuthState = JSON.parse(user);
    return parsedAuthState.extraFeature?.includes('Category') || false;
  }
  return false;
};

const safe = (v) => (typeof v === 'string' ? v : '');
const getId = (p) => p?.id ?? p?._id ?? '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject';
}

export function ProductGrid({
  products,
  categories,
  vendors,
  onView,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
  onAddStock,
}) {
  if (!products?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No products found.
      </p>
    );
  }

  const getVendorName = (vendorId) => {
    const vendor = vendors.find((v) => v._id === vendorId);
    return vendor?.name || vendorId || '—';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 mb-8">
      {products.map((product) => {
        const id = getId(product);
        const isPending = pendingId === id;

        const keyOpen = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
          }
        };

        return (
          <Card
            key={id}
            role="button"
            tabIndex={0}
            onKeyDown={keyOpen}
            className="group relative overflow-hidden border-border bg-card p-4 rounded-2xl transition hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 rounded-xl bg-primary text-background grid place-items-center shrink-0"
                onClick={() => onOpenSheet(product)}
              >
                <Tag className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0" onClick={() => onOpenSheet(product)}>
                    <h3 className="font-semibold text-md text-foreground truncate">
                      {safe(product.productName) || 'Untitled product'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {hasCategoriesFeature() ? (product.subCategory || 'No subcategory') : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant(product.isActive)}
                      className="h-6 px-2 text-[10px] shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 opacity-80 hover:opacity-100"
                          aria-label="Open actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <HoverCard openDelay={100} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <DropdownMenuItem className="cursor-default" onClick={(e) => e.stopPropagation()}>
                              Change Status
                            </DropdownMenuItem>
                          </HoverCardTrigger>
                          <HoverCardContent side="left" align="start" className="w-64">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Set Active</span>
                                <Switch
                                  checked={!!product.isActive}
                                  onCheckedChange={() => handleToggle?.(product)}
                                  disabled={!!isPending}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Toggle to {product.isActive ? 'deactivate' : 'activate'} this product.
                              </p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={(e) => { e.stopPropagation(); handleToggle(product); }}
                                disabled={isPending}
                              >
                                {isPending ? 'Updating…' : product.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(product); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddStock?.(product); }}>
                          <PackagePlus className="mr-2 h-4 w-4" /> Add Stock
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDelete?.(product); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-3" onClick={(e) => { e.stopPropagation(); onOpenSheet(product); }}>
              {hasCategoriesFeature() && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Category</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                    <span className="truncate">{safe(product.categoryName) || '—'}</span>
                  </div>
                </div>
              )}

              {hasVendorsFeature() && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Vendor</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                    <span className="truncate">{getVendorName(product.vendor)}</span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">SKU</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <span className="truncate">{safe(product.SKU) || '—'}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Price</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <span className="truncate">${product.sellingPrice.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Attributes</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <span className="truncate">
                    {product.attribute?.length
                      ? product.attribute.map((attr) => `${attr.key}: ${attr.value}`).join(', ')
                      : '—'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Custom Attributes</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <span className="truncate">
                    {product.customAttributes?.length
                      ? product.customAttributes.map((attr) => `${attr.key}: ${attr.value}`).join(', ')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <Badge variant="secondary" className="h-6 px-2 text-[10px]">Product</Badge>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> {fmtDate(product.createdAt)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}