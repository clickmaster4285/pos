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
import { Tag, Edit, Trash2, MoreVertical, PackagePlus } from 'lucide-react';

function getStatusVariant(status) {
  switch (status) {
    case 'active':
      return 'active';
    case 'inactive':
      return 'reject';
    default:
      return 'default';
  }
}

export function ProductList({
  products,
  categories,
  vendors,
  onView,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
  onAddStock, // New prop for handling stock addition
}) {
  if (!products?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">
        No products found.
      </p>
    );
  }

  const getVendorName = (vendorId) => {
    const vendor = vendors.find((v) => v._id === vendorId);
    return vendor?.name || '—';
  };

  return (
    <Card className="divide-y border-border p-2">
      <div className="grid grid-cols-18 items-center px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="col-span-2">Product</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Vendor</div>
        <div className="col-span-2">SKU</div>
        <div className="col-span-2">Cost Price</div>
        <div className="col-span-2">Selling Price</div>
        <div className="col-span-2">Total quantity</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {products.map((p) => {
        const isPending = pendingId && pendingId === (p.id ?? p._id);
        const statusLabel = p.isActive ? 'Active' : 'Inactive';

        return (
          <div
            key={p.id}
            className="grid grid-cols-18 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
          >
            <div className="col-span-2 mb-2 sm:mb-0" onClick={() => onOpenSheet(p)}>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary text-background rounded-lg shrink-0">
                  <Tag className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium leading-tight truncate">{p.productName}</p>
              </div>
            </div>

            <div className="col-span-2 mb-2 sm:mb-0" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-muted-foreground truncate">{p.categoryName || '—'}</p>
            </div>

            <div className="col-span-2 mb-2 sm:mb-0" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-muted-foreground truncate">{getVendorName(p.vendor)}</p>
            </div>

            <div className="col-span-2 mb-2 sm:mb-0" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-muted-foreground truncate">{p.SKU || '—'}</p>
            </div>

            <div className="col-span-2 mb-2 sm:mb-0" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-muted-foreground truncate">${p.costPrice.toFixed(2)}</p>
            </div>

            <div className="col-span-2 mb-2 sm:mb-0" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-muted-foreground truncate">${p.sellingPrice.toFixed(2)}</p>
            </div>

            <div className="col-span-2 mb-2 sm:mb-0" onClick={() => onOpenSheet(p)}>
              <p className="text-sm text-muted-foreground truncate">{p.quantity}</p>
            </div>

            <div className="col-span-2 flex items-center justify-center">
              <Badge variant={getStatusVariant(statusLabel)} className="h-6 px-2 text-[10px]">
                {statusLabel}
              </Badge>
            </div>

            <div className="col-span-2">
              <div className="flex justify-start sm:justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(p)}
                  className="h-8 w-8 p-0 hover:bg-accent"
                  aria-label="Edit product"
                >
                  <Edit className="h-3 w-3" />
                </Button>

                <Button
  size="sm"
  variant="delete"
  onClick={() => onDelete(p)}
  className="h-8 w-8 p-0"
  aria-label="Delete product"
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
                        <DropdownMenuItem className="cursor-default">Change Status</DropdownMenuItem>
                      </HoverCardTrigger>
                      <HoverCardContent side="left" align="start" className="w-64">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Set Active</span>
                            <Switch
                              checked={!!p.isActive}
                              onCheckedChange={() => handleToggle?.(p)}
                              disabled={!!isPending}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Toggle to {p.isActive ? 'deactivate' : 'activate'} this product.
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleToggle?.(p)}
                            disabled={!!isPending}
                          >
                            {isPending ? 'Updating…' : p.isActive ? 'Deactivate' : 'Activate'}
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