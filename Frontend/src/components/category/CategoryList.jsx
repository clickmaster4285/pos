'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { Tag, Edit, Trash2, MoreVertical } from 'lucide-react';

function getStatusVariant(status) {
  switch (status) {
    case 'Active':
      return 'active';
    case 'Inactive':
      return 'reject';
    default:
      return 'default';
  }
}

export function CategoryList({
  categories,
  onView,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
}) {
  if (!categories?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">
        No categories found.
      </p>
    );
  }

  return (
    <Card className="divide-y border-border">
      {/* Header row */}
      <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="col-span-2">Category</div>
        <div className="col-span-3">Description</div>
        <div className="col-span-3">Sub Categories</div>
        <div className="col-span-2">Tags</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Rows */}
      {categories.map((c) => {
        const isPending = pendingId && pendingId === (c.id ?? c._id);
        const statusLabel = c.isActive ? 'Active' : 'Inactive';

        return (
          <div
            key={c.id}
            className="grid grid-cols-12 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
          >
            {/* Category */}
            <div
              className="col-span-12 sm:col-span-2 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(c)}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-primary/90 to-secondary-foreground/90 text-card rounded-lg shrink-0">
                  <Tag className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium leading-tight truncate">
                  {c.categoryName}
                </p>
              </div>
            </div>

            {/* Description */}
            <div
              className="col-span-6 sm:col-span-3 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(c)}
            >
              <p className="text-sm text-muted-foreground truncate">
                {c.description || '—'}
              </p>
            </div>

            {/* Sub Categories */}
            <div
              className="col-span-6 sm:col-span-3 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(c)}
            >
              <p className="text-sm text-muted-foreground truncate">
                {c.subCategory?.length ? c.subCategory.join(', ') : '—'}
              </p>
            </div>

            {/* Tags */}
            <div
              className="col-span-9 sm:col-span-2 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(c)}
            >
              <p className="text-sm text-muted-foreground truncate">
                {c.tags?.length ? c.tags.join(', ') : '—'}
              </p>
            </div>

            {/* Status */}
            <div className="col-span-3 sm:col-span-1 flex items-center justify-center">
              <Badge
                variant={getStatusVariant(statusLabel)}
                className="h-6 px-2 text-[10px]"
              >
                {statusLabel}
              </Badge>
            </div>

            {/* Actions */}
            <div className="col-span-3 sm:col-span-1">
              <div className="flex justify-start sm:justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(c)}
                  className="h-8 w-8 p-0 hover:bg-accent"
                  aria-label="Edit category"
                >
                  <Edit className="h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  variant="delete"
                  onClick={() => onDelete(c)}
                  className="h-8 w-8 p-0"
                  aria-label="Delete category"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-accent"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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
                            <span className="text-sm font-medium">
                              Set Active
                            </span>
                            <Switch
                              checked={!!c.isActive}
                              onCheckedChange={() => handleToggle?.(c)}
                              disabled={!!isPending}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Toggle to {c.isActive ? 'deactivate' : 'activate'}{' '}
                            this category.
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleToggle?.(c)}
                            disabled={!!isPending}
                          >
                            {isPending
                              ? 'Updating…'
                              : c.isActive
                              ? 'Deactivate'
                              : 'Activate'}
                          </Button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
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