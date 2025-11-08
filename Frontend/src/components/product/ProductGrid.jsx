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
import {
  Edit,
  Trash2,
  Calendar,
  MoreVertical,
  PackagePlus,
  Image as ImageIcon,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { ProductImageCarousel } from './ProductImageCarousel';

import { use } from 'react';
const hasVendorsFeature = (user) =>
  user?.extraFeature?.includes('Vendors') ?? false;
const hasCategoriesFeature = (user) =>
  user?.extraFeature?.includes('Category') ?? false;

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
  ingredients,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
  onAddStock,
  hasVendors,
  hasCategories,
}) {
  if (!products?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No products found.
      </p>
    );
  }
  console.log('products', products);


  const user = useSelector((state) => state.auth.user);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const industry = user?.industryName || '';
  const industryLC = (industry || '').toLowerCase();
  const isRestaurant = industryLC === 'restaurant';

  const getVendorName = (vendorId) => {
    const vendor = vendors.find((v) => v._id === vendorId);
    return vendor?.vendorName || vendorId || '—';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
      {products.map((product) => {
        const id = getId(product);
        const isPending = pendingId === id;
        const hasImages =
          product.imgUrl &&
          (Array.isArray(product.imgUrl)
            ? product.imgUrl.length > 0
            : !!product.imgUrl);
        const meta = product.metaData || {};

        return (
          <Card
            key={id}
            role="button"
            tabIndex={0}
            className="group relative overflow-hidden border-border bg-card rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer hover:scale-[1.02]"
            onClick={() => onOpenSheet(product)}
          >
            <div className="relative h-48 w-full overflow-hidden bg-muted/30">
              {hasImages ? (
                <ProductImageCarousel
                  imgUrls={product.imgUrl}
                  apiUrl={API_URL}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  alt={safe(product.productName) || 'Product image'}
                  showCounter={true}
                  showArrows={true}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/70">No image</p>
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3">
                <Badge
                  variant={statusVariant(product.isActive)}
                  className="h-6 px-2 text-xs font-medium backdrop-blur-sm bg-background/80"
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 backdrop-blur-sm bg-background/80 hover:bg-background"
                      aria-label="Open actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <HoverCard openDelay={100} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <DropdownMenuItem className="cursor-default">
                          Change Status
                        </DropdownMenuItem>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="left"
                        align="start"
                        className="w-64"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status</span>
                            <Switch
                              checked={!!product.isActive}
                              onCheckedChange={() => handleToggle?.(product)}
                              disabled={!!isPending}
                            />
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(product);
                            }}
                            disabled={isPending}
                          >
                            {isPending
                              ? 'Updating…'
                              : product.isActive
                              ? 'Deactivate'
                              : 'Activate'}
                          </Button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(product);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddStock?.(product);
                      }}
                    >
                      <PackagePlus className="mr-2 h-4 w-4" /> Add Stock
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(product);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground line-clamp-2 leading-tight">
                  {safe(product.productName) || 'Untitled product'}
                </h3>
                {hasCategoriesFeature(user) && (
                  <p className="text-sm text-muted-foreground truncate">
                    {product.subCategoryName || 'No subcategory'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {hasCategoriesFeature(user) && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Category
                    </p>
                    <p className="text-foreground truncate">
                      {product.category || '—'}
                    </p>
                  </div>
                )}

                {hasVendorsFeature(user) && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Vendor
                    </p>
                    <p className="text-foreground truncate">
                      {getVendorName(product.vendor)}
                    </p>
                  </div>
                )}

                {isRestaurant && (
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Ingredients
                    </p>
                    <p className="text-foreground line-clamp-2 text-xs">
                      {products.ingredient
                        ?.map((i) => `${i.quantity} ${i.ingredientName}`)
                        .join(', ') || '—'}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                    Extra
                  </p>
                  <p className="text-foreground text-xs line-clamp-2">
                    {Object.entries(product.metaData || {})
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' • ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                    SKU
                  </p>
                  <p className="text-foreground font-mono text-xs">
                    {safe(product.SKU) || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                    Price
                  </p>
                  <p className="text-foreground font-semibold text-green-600">
                    ${product.sellingPrice?.toFixed(2) || '0.00'}
                  </p>
                </div>

                {/* Important Meta */}
                {meta.isVegetarian !== undefined && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Vegetarian
                    </p>
                    <p className="text-foreground">
                      {meta.isVegetarian ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}
                {meta.spiceLevel && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Spice
                    </p>
                    <p className="text-foreground">{meta.spiceLevel}</p>
                  </div>
                )}
                {meta.preparationTime && (
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Prep Time
                    </p>
                    <p className="text-foreground">
                      {meta.preparationTime} min
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                  Product
                </Badge>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />{' '}
                  {fmtDate(product.createdAt)}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
