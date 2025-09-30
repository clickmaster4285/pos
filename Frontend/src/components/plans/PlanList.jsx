'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Pencil,
  Trash2,
  Layers,
  Package,
  Users,
  Building2,
} from 'lucide-react';

function getStatusVariant(status) {
  switch (status) {
    case 'Active':
      return 'active';
    case 'Inactive':
      return 'reject';
    case 'Pending':
      return 'pending';
    default:
      return 'default';
  }
}

export function PlanList({ plans, onEdit, onDelete, onView }) {
  const [descOpen, setDescOpen] = useState(false);
  const [descPlan, setDescPlan] = useState(null);

  const openDesc = (plan) => {
    setDescPlan(plan);
    setDescOpen(true);
  };

  if (!plans?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">No plans found.</p>
    );
  }

  return (
    <>
      <Card className="divide-y border-border">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-24 items-center px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div className="col-span-5">Plan</div>
          <div className="col-span-3">Price</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-5">Features</div>
          <div className="col-span-2">Max Staff</div>
          <div className="col-span-2">Max Vendors</div>
          <div className="col-span-2">Max Inventory</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Rows */}
        {plans.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-1 sm:grid-cols-24 items-center px-4 py-3 gap-y-3 hover:bg-accent/30 transition-colors"
          >
            {/* Plan */}
            <div className="sm:col-span-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold leading-tight truncate">
                      {p.name}
                    </p>
                    {p.status ? (
                      <Badge
                        variant={getStatusVariant(p.status)}
                        className="shrink-0"
                      >
                        {p.status}
                      </Badge>
                    ) : null}
                  </div>

                  {/* View description button (opens dialog) */}
                  {p.description ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-6 px-0 text-xs text-primary"
                      onClick={() => openDesc(p)}
                    >
                      View description
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      No description
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="sm:col-span-3">
              <div className="text-sm font-medium">
                ₨ {Number(p.price || 0).toLocaleString()}
              </div>
            </div>

            {/* Type */}
            <div className="sm:col-span-3">
              <div className="text-sm text-muted-foreground">
                {p.type || 'Basic'}
              </div>
            </div>

            {/* Features (badges) */}
            <div className="sm:col-span-5">
              {Array.isArray(p.features) && p.features.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {p.features.slice(0, 6).map((f, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs font-normal px-2 py-0.5"
                    >
                      {f}
                    </Badge>
                  ))}
                  {p.features.length > 6 && (
                    <span className="text-xs text-muted-foreground">
                      +{p.features.length - 6} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No features
                </span>
              )}
            </div>

            {/* Max Staff */}
            <div className="sm:col-span-2">
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3 text-secondary-foreground" />
                <span className="text-foreground font-medium">
                  {p.maxUsers || 0}
                </span>
              </div>
            </div>

            {/* Max Vendors */}
            <div className="sm:col-span-2">
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 text-secondary-foreground" />
                <span className="text-foreground font-medium">
                  {p.maxVendors || 0}
                </span>
              </div>
            </div>

            {/* Max Inventory + Actions */}
            <div className="sm:col-span-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Package className="h-3 w-3 text-secondary-foreground" />
                <span className="text-foreground font-medium">
                  {p.maxVehicles || 0}
                </span>
              </div>

              <div className="flex gap-1">
                {onView ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(p)}
                    className="h-8 px-2 hover:bg-accent"
                  >
                    View
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(p)}
                  className="h-8 w-8 p-0 hover:bg-accent"
                  aria-label="Edit plan"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(p.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete plan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Description Dialog */}
      <Dialog open={descOpen} onOpenChange={setDescOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{descPlan?.name || 'Description'}</DialogTitle>
            <DialogDescription asChild>
              <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {descPlan?.description || 'No description available.'}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
