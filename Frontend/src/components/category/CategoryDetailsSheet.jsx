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
import { Calendar, Clock, Pencil, Trash2, Tag } from 'lucide-react';

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
  // if (Number.isNaN(d.getTime())) return '—';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}


export function CategoryDetailsSheet({
  open,
  onOpenChange,
  category,
  onEdit,
  onDelete,
  onToggle,
  pending = false,
}) {
  if (!category) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Category</SheetTitle>
            <SheetDescription>Loading…</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const isActive = !!category.isActive;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="md:max-w-lg p-0">
        {/* Header with gradient background */}
        <div className="bg-linear-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 p-6">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border shadow-sm font-semibold text-blue-700 dark:text-blue-300">
                  {initials(category.categoryName)}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-gray-900 dark:text-white">
                    {category.categoryName || 'Category'}
                  </SheetTitle>
                  <SheetDescription className="truncate text-gray-600 dark:text-gray-300">
                    {category.subCategory?.length
                      ? `Subcategories: ${category.subCategory.join(', ')}`
                      : 'Category details'}
                  </SheetDescription>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`px-2 py-1 text-xs font-medium ${isActive
                    ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300'
                    : ''
                  }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Information Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category Information
              </h3>

              {/* Description */}
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mt-0.5">
                  <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Description</div>
                  <div className="text-sm font-medium whitespace-pre-wrap break-words">
                    {category.description || '—'}
                  </div>
                </div>
              </div>

              {/* Sub Categories */}
              <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mt-0.5">
                  <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Sub Categories</div>
                  <div className="text-sm font-medium">
                    {category.subCategory?.length
                      ? category.subCategory.join(', ')
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mt-0.5">
                  <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Tags</div>
                  <div className="text-sm font-medium">
                    {category.tags?.length ? category.tags.join(', ') : '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created</span>
                  </div>
                  <div className="text-sm font-medium">
                    {prettyDate(category.createdAt)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Updated</span>
                  </div>
                  <div className="text-sm font-medium">
                    {prettyDate(category.updatedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => onEdit(category)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => onDelete(category)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onToggle && (
                <Button
                  type="button"
                  variant={isActive ? 'secondary' : 'default'}
                  className="gap-2 flex-1 min-w-[120px]"
                  onClick={() => onToggle(category)}
                  disabled={pending}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}

              <SheetClose asChild>
                <Button type="button" variant="" className="">
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