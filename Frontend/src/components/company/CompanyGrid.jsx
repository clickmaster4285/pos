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

const safe = (v) => (typeof v === 'string' ? v : '—');
const getId = (c) => c?.id ?? c?._id ?? c?.companyId ?? '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const num = (v) => (Number.isFinite(v) ? v : 0);

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject'; // your shadcn custom variants
}

export function CompanyGrid({
  items = [],

  handleToggle, // (company) => void
  pendingId, // company id currently toggling
}) {
  if (!items?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No companies found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 mb-8">
      {items.map((company) => {
        const id = getId(company);
        const isPending = pendingId === id;

        const usersCount = Array.isArray(company?.gain?.staff)
          ? company.gain.staff.length
          : 0;
        const vendorsCount = num(company?.gain?.vendor);
        const inventoryCount = num(company?.gain?.inventory);
        const planCount = Array.isArray(company?.plan)
          ? company.plan.length
          : 0;

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
                      {safe(company.name)}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Array.isArray(company.plan) &&
                      company.plan.length > 0 ? (
                        company.plan.map((pl, idx) => (
                          <Badge
                            key={pl._id || idx}
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {safe(pl.name)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No Plans
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <Badge
                      variant={statusVariant(!!company.isActive)}
                      className="h-6 px-2 text-[10px] shrink-0"
                    >
                      {company.isActive ? 'Active' : 'Inactive'}
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
                                  checked={!!company.isActive}
                                  onCheckedChange={() =>
                                    handleToggle?.(company)
                                  }
                                  disabled={isPending}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Toggle to{' '}
                                {company.isActive ? 'deactivate' : 'activate'}{' '}
                                this company.
                              </p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleToggle?.(company)}
                                disabled={isPending}
                              >
                                {isPending
                                  ? 'Updating…'
                                  : company.isActive
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
                  <span className="truncate">{safe(company.contactEmail)}</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Phone
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{safe(company.contactPhone)}</span>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Address
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{safe(company.address)}</span>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground flex gap-3">
                <span>
                  Users:{' '}
                  <strong className="text-foreground">{usersCount}</strong>
                </span>
                <span>
                  Vendors:{' '}
                  <strong className="text-foreground">{vendorsCount}</strong>
                </span>
                <span>
                  Inventory:{' '}
                  <strong className="text-foreground">{inventoryCount}</strong>
                </span>
                <span>
                  Plans:{' '}
                  <strong className="text-foreground">{planCount}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(company.createdAt)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
