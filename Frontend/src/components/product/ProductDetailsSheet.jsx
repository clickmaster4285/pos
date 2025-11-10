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
      <div className="bg-primary p-2 rounded-lg mt-0.5">
        <Icon className="h-4 w-4 text-card " />
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
        <div className="border-b">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border shadow-xs font-semibold text-slate-700 dark:text-slate-300">
                  {initials(product.productName)}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg font-semibold text-foreground truncate">
                    {product.productName || 'Unnamed Product'}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground truncate">
                    {hasCategoriesFeature()
                      ? product.subCategoryName || 'No subcategory'
                      : 'Product details'}
                  </SheetDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`px-3 py-1.5 text-xs font-medium ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                    : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>

              <div className="text-xs text-muted-foreground">
                SKU: {product.SKU || 'N/A'}
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="p-2 space-y-6">
          {/* Basic Information Card */}
          <Card className="shadow-xs p-4">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
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
                {!isRestaurant &&  hasVendorsFeature() && (
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
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Details
                  </h3>
                </div>

                <div className="divide-y">
                  {metaFields.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-3 px-4"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-foreground">
                          {Array.isArray(value)
                            ? value.join(', ')
                            : typeof value === 'boolean'
                            ? value
                              ? 'Yes'
                              : 'No'
                            : String(value) || '—'}
                        </div>
                      </div>
                    </div>
                  ))}
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
