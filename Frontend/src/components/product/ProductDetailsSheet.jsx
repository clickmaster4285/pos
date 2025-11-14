'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Tag,
  Package,
  DollarSign,
  FileText,
  Barcode,
  Truck,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useSelector } from 'react-redux';

const hasVendorsFeature = () => {
  const user = useSelector((state) => state.auth.user);
  return user?.extraFeature?.includes('Vendors') || false;
};

const hasCategoriesFeature = () => {
  const user = useSelector((state) => state.auth.user);
  return user?.extraFeature?.includes('Category') || false;
};

function initials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function prettyDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProductDetailsSheet({
  open,
  onOpenChange,
  product,
  categories,
  vendors,
  ingredients,
  onEdit,
  onDelete,
  onToggle,
  pending = false,
}) {
  if (!product) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-3xl p-6 overflow-y-auto"
        >
          {/* Header */}
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>Product Details</SheetTitle>
            <SheetDescription>Loading product information...</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const isActive = !!product.isActive;
  const vendorName = hasVendorsFeature()
    ? vendors.find((v) => v._id === product.vendor)?.vendorName ||
      product.vendor ||
      '—'
    : null;

  const metaFields = product.metaData ? Object.entries(product.metaData) : [];

  const InfoRow = ({ icon: Icon, label, value, className = '' }) => (
    <div className={`flex items-start gap-3 py-3 ${className}`}>
      {/* Dot / bullet */}
      <div className="mt-1">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {label}
        </div>
        <div className="text-sm text-foreground">{value || '—'}</div>
      </div>
    </div>
  );
  const user = useSelector((state) => state.auth.user);
  const industry = user?.industryName || '';
  const industryLC = (industry || '').toLowerCase();
  const isRestaurant = industryLC === 'restaurant';
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg:background w-full sm:max-w-2xl lg:max-w-3xl p-6 overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b ">
          <SheetHeader className="space-y-4 py-3">
            {/* Top row: avatar + name + status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar / initials */}
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border shadow-sm font-semibold text-slate-700 dark:text-slate-200">
                  {initials(product.productName)}
                </div>

                {/* Name + subcategory */}
                <div className="min-w-0">
                  <SheetTitle className="text-base sm:text-lg font-semibold text-foreground truncate">
                    {product.productName || 'Unnamed Product'}
                  </SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm text-muted-foreground truncate">
                    {hasCategoriesFeature()
                      ? product.subCategoryName || 'No subcategory'
                      : 'Product details'}
                  </SheetDescription>
                </div>
              </div>

              {/* Status pill */}
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap flex items-center ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                    : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Meta row: SKU + Quantity */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pb-2">
              <span className="inline-flex items-center gap-1">
                <span className="font-medium">SKU:</span>
                <span className="font-normal">{product.SKU || 'N/A'}</span>
              </span>

              <span className="inline-flex items-center gap-1">
                <span className="font-medium">Quantity:</span>
                <span className="font-normal">{product.quantity ?? 'N/A'}</span>
              </span>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="p-2 space-y-6">
          {/* Basic Information Card */}
          <Card className="shadow-xs p-4">
            <CardContent className="p-0">
              <div className="py-4 border-b">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <div className="bg-gradient-to-r from-primary/90 to-secondary-foreground/90 p-2 rounded-md">
                    <Package className="h-4 w-4 text-card" />
                  </div>
                  Basic Information
                </h3>
              </div>

              <div className="divide-y">
                {/* Category */}
                {!isRestaurant && hasCategoriesFeature() && (
                  <InfoRow
                    icon={Layers}
                    label="Category"
                    value={product.category}
                  />
                )}

                {/* Vendor */}
                {!isRestaurant && hasVendorsFeature() && (
                  <InfoRow icon={Truck} label="Vendor" value={vendorName} />
                )}

                {/* Price */}
                <InfoRow
                  icon={DollarSign}
                  label="Price"
                  value={
                    product.sellingPrice
                      ? `$${product.sellingPrice.toFixed(2)}`
                      : '$0.00'
                  }
                />

                {/* Description */}
                {product.description && (
                  <InfoRow
                    icon={FileText}
                    label="Description"
                    value={product.description}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ingredients Card */}
          {isRestaurant && (
            <Card className="shadow-xs">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Ingredients
                  </h3>
                </div>

                <div className="p-4">
                  {product.ingredient?.length ? (
                    <div className="space-y-2">
                      {product.ingredient.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">
                            {ingredient.ingredientName}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {ingredient.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No ingredients specified
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <Card className="shadow-xs">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>
                </div>

                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="px-2.5 py-1 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          {metaFields.length > 0 && (
            <Card className="shadow-xs">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b ">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 ">
                    <div className="bg-gradient-to-r from-primary/90 to-secondary-foreground/90 p-2 rounded-md">
                      <FileText className="h-4 w-4 text-card" />
                    </div>
                    Additional details
                  </h3>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-background text-muted-foreground border">
                    {metaFields.length} field{metaFields.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px ">
                  {metaFields.map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').trim();
                    const isBoolean = typeof value === 'boolean';
                    const isArray = Array.isArray(value);

                    let displayValue;
                    if (isArray) {
                      displayValue = value.length ? value.join(', ') : '—';
                    } else if (isBoolean) {
                      displayValue = value ? 'Yes' : 'No';
                    } else {
                      const str = String(value ?? '').trim();
                      displayValue = str || '—';
                    }

                    return (
                      <div
                        key={key}
                        className="bg-card px-4 py-3 flex items-start gap-3"
                      >
                        {/* Dot / bullet */}
                        <div className="mt-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                            {label}
                          </div>

                          {isBoolean ? (
                            <span
                              className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                value
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {displayValue}
                            </span>
                          ) : (
                            <div className="mt-1 text-sm text-foreground break-words">
                              {displayValue}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className="shadow-xs">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Created
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {prettyDate(product.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Last Updated
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {prettyDate(product.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/20 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              {onEdit && (
                <Button
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => onEdit(product)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  className="gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
                  onClick={() => onDelete(product)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onToggle && (
                <Button
                  variant={isActive ? 'outline' : 'default'}
                  className="gap-2 flex-1 min-w-[120px]"
                  onClick={() => onToggle(product)}
                  disabled={pending}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              <SheetClose asChild>
                <Button variant="outline" className="gap-2">
                  Close
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
