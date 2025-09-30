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
  Building2,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
} from 'lucide-react';

const safe = (v) => (typeof v === 'string' ? v : '');
const getId = (v) => v?.id ?? v?._id ?? '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject'; // your custom shadcn badge variants
}

export function VendorGrid({
  vendors,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
}) {
  if (!vendors?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No vendors found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 mb-8">
      {vendors.map((vendor) => {
        const id = getId(vendor);
        const isPending = pendingId === id; // ✅ local pending state

        return (
          <Card
            key={id}
            className="group relative overflow-hidden border-border bg-card p-4 rounded-2xl transition hover:shadow-lg"
          >
            {/* Top row: icon + name + status + menu */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-md text-foreground truncate">
                      {safe(vendor.name) || 'Untitled vendor'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {safe(vendor.contactName) || 'No contact'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge shown in grid */}
                    <Badge
                      variant={statusVariant(vendor.isActive)}
                      className="h-6 px-2 text-[10px] shrink-0"
                    >
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </Badge>

                    {/* 3-dot actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 opacity-80 hover:opacity-100"
                          aria-label="Open actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Change Status (hover panel with toggle) */}
                        <HoverCard openDelay={100} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <DropdownMenuItem className="cursor-default">
                              Change Status
                            </DropdownMenuItem>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="right"
                            align="start"
                            className="w-64"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Set Active
                                </span>
                                <Switch
                                  checked={!!vendor.isActive}
                                  onCheckedChange={() => handleToggle(vendor)}
                                  disabled={isPending}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Toggle to{' '}
                                {vendor.isActive ? 'deactivate' : 'activate'}{' '}
                                this vendor.
                              </p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleToggle(vendor)}
                                disabled={isPending}
                              >
                                {isPending
                                  ? 'Updating…'
                                  : vendor.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </Button>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <DropdownMenuItem onClick={() => onEdit?.(vendor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete?.(vendor)}
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

            {/* labeled blocks */}
            <div className="space-y-4 mt-3">
              {/* Email */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Email
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{safe(vendor.email) || '—'}</span>
                </div>
              </div>

              {/* Contact No */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Contact No
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{safe(vendor.phone) || '—'}</span>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Address
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {safe(vendor.address) || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                {vendor.paymentType || '—'}
              </Badge>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(vendor.createdAt)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
