'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';

const safe = (v) => (typeof v === 'string' ? v : '—');
const getId = (c) => c?.id ?? c?._id ?? c?.companyId ?? '';

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject';
}

export function CompanyList({
  items = [],

  handleToggle, 
  pendingId, 
}) {
  if (!items?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">
        No companies found.
      </p>
    );
  }

  return (
    <Card className="divide-y border-border">
      {/* Header row */}
      <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="col-span-3">Company</div>
        <div className="col-span-2">Email</div>
        <div className="col-span-2">Phone</div>
        <div className="col-span-3">Address</div>
        <div className="col-span-1 text-center">Status</div>
      </div>

      {/* Rows */}
      {items.map((c) => {
        const id = getId(c);
        const isPending = pendingId === id;
        const plans = Array.isArray(c.plan) ? c.plan : [];

        return (
          <div
            key={id}
            className="grid grid-cols-12 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
          >
            {/* Company (icon + name + plans) */}
            <div className="col-span-12 sm:col-span-3 mb-2 sm:mb-0">
              <div className="flex items-start gap-2">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {safe(c.name)}
                  </p>
                  {/* Plans as small badges */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {plans.length > 0 ? (
                      plans.slice(0, 4).map((pl, idx) => (
                        <Badge
                          key={pl?._id || idx}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {safe(pl?.name)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        No Plans
                      </span>
                    )}
                    {plans.length > 4 ? (
                      <span className="text-[10px] text-muted-foreground">
                        +{plans.length - 4} more
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="col-span-6 sm:col-span-2 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{safe(c.contactEmail)}</span>
              </div>
            </div>

            {/* Phone */}
            <div className="col-span-6 sm:col-span-2 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{safe(c.contactPhone)}</span>
              </div>
            </div>

            {/* Address */}
            <div className="col-span-12 sm:col-span-3 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <MapPin className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{safe(c.address)}</span>
              </div>
            </div>

            {/* Status (badge) */}
            <div className="col-span-3 sm:col-span-1 flex items-center justify-center">
              <Badge
                variant={statusVariant(!!c.isActive)}
                className="h-6 px-2 text-[10px]"
              >
                {c.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="col-span-3 sm:col-span-1">
              <div className="flex justify-start sm:justify-end gap-1">
                {/* 3-dot with HoverCard to change status */}
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
                            this company.
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
