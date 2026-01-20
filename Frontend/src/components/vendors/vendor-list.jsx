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

import {
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  MoreVertical,
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

export function VendorList({
  vendors,
  onView,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
}) {
  if (!vendors?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">
        No vendors found.
      </p>
    );
  }

  return (
    <Card className="divide-y border-border">
      {/* Header row */}
      <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="col-span-2">Vendor</div>
        <div className="col-span-2">Contact</div>
        <div className="col-span-2">Phone</div>
        <div className="col-span-3">Email</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Rows */}
      {vendors.map((v) => {
        const isPending = pendingId && pendingId === (v.id ?? v._id);
        const statusLabel = v.isActive ? 'Active' : 'Inactive';

        return (
          <div
            key={v.id}
            className="grid grid-cols-12 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
          >
            {/* Vendor */}
            <div
              className="col-span-12 sm:col-span-2 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(v)}
            >
              <div className="flex items-center gap-2">
                <div className="p-2  bg-linear-to-r from-primary/90 to-secondary-foreground/90 text-background  rounded-lg shrink-0">
                  <Building2 className="h-4 w-4 " />
                </div>
                <p className="text-sm font-medium leading-tight truncate">
                  {v.name}
                </p>
              </div>
            </div>

            {/* Contact Name */}
            <div
              className="col-span-6 sm:col-span-2 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(v)}
            >
              <p className="text-sm text-muted-foreground font-medium truncate">
                {v.contactName}
              </p>
            </div>

            {/* Phone */}
            <div
              className="col-span-6 sm:col-span-2 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(v)}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{v.phone}</span>
              </div>
            </div>

            {/* Email */}
            <div
              className="col-span-9 sm:col-span-3 mb-2 sm:mb-0"
              onClick={() => onOpenSheet(v)}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{v.email}</span>
              </div>
            </div>

            {/* Status (badge) */}
            <div className="col-span-3 sm:col-span-1 flex items-center justify-center">
              <Badge
                variant={getStatusVariant(statusLabel)}
                className="h-6 px-2 text-[10px]"
              >
                {statusLabel}
              </Badge>
            </div>

            {/* Actions */}
            <div className="col-span-3 sm:col-span-2">
              <div className="flex justify-start sm:justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(v)}
                  className="h-8 w-8 p-0 hover:bg-accent"
                  aria-label="Edit vendor"
                >
                  <Edit className="h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  variant="delete"
                  onClick={() => onDelete(v)}
                  className="h-8 w-8 p-0"
                  aria-label="Delete vendor"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                {/* 3-dot with HoverCard to change status (same as grid) */}
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
                              checked={!!v.isActive}
                              onCheckedChange={() => handleToggle?.(v)}
                              disabled={!!isPending}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Toggle to {v.isActive ? 'deactivate' : 'activate'}{' '}
                            this vendor.
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleToggle?.(v)}
                            disabled={!!isPending}
                          >
                            {isPending
                              ? 'Updating…'
                              : v.isActive
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
