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
  Tag,
  Edit,
  Trash2,
  Calendar,
  MoreVertical,
} from 'lucide-react';

const safe = (v) => (typeof v === 'string' ? v : '');
const getId = (c) => c?.id ?? c?._id ?? '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject';
}

export function CategoryGrid({
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
      <p className="text-center text-muted-foreground py-8">
        No categories found.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 mb-8">
      {categories.map((category) => {
        const id = getId(category);
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
            {/* Top row: icon + name + status + menu */}
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 rounded-xl bg-primary text-background grid place-items-center shrink-0"
                onClick={() => onOpenSheet(category)}
              >
                <Tag className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0" onClick={() => onOpenSheet(category)}>
                    <h3 className="font-semibold text-md text-foreground truncate">
                      {safe(category.categoryName) || 'Untitled category'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {category.subCategory?.length
                        ? category.subCategory.join(', ')
                        : 'No subcategories'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant(category.isActive)}
                      className="h-6 px-2 text-[10px] shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
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
                      <DropdownMenuContent
                        align="end"
                        className="w-48"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <HoverCard openDelay={100} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <DropdownMenuItem
                              className="cursor-default"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Change Status
                            </DropdownMenuItem>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="right"
                            align="start"
                            className="w-64"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Set Active
                                </span>
                                <Switch
                                  checked={!!category.isActive}
                                  onCheckedChange={() => handleToggle(category)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                  disabled={isPending}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Toggle to{' '}
                                {category.isActive ? 'deactivate' : 'activate'}{' '}
                                this category.
                              </p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle(category);
                                }}
                                disabled={isPending}
                              >
                                {isPending
                                  ? 'Updating…'
                                  : category.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </Button>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(category);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(category);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {/* Labeled blocks */}
            <div
              className="space-y-4 mt-3"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSheet(category);
              }}
            >
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Description
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <span className="truncate">{safe(category.description) || '—'}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Sub Categories
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <span className="truncate">
                    {category.subCategory?.length
                      ? category.subCategory.join(', ')
                      : '—'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Tags
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <span className="truncate">
                    {category.tags?.length ? category.tags.join(', ') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="pt-3 border-t border-border flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                Category
              </Badge>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(category.createdAt)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}