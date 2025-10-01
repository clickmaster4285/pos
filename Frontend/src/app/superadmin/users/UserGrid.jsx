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
import { User, Mail, Phone, MapPin, Calendar, MoreVertical } from 'lucide-react';

const safe = (v) => (typeof v === 'string' ? v : '—');
const getId = (u) => u?.id ?? u?._id ?? u?.userId ?? '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject';
}

export function UserGrid({ items = [], handleToggle, pendingId }) {
  if (!items?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No users found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 mb-8">
      {items.map((user) => {
        const id = getId(user);
        const isPending = pendingId === id;

        return (
          <Card
            key={id}
            className="group relative overflow-hidden border-border bg-card p-4 rounded-2xl transition hover:shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-md text-foreground truncate">
                      {safe(user.name)}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {safe(user.role)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant(!!user.isActive)}
                      className="h-6 px-2 text-[10px] shrink-0"
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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
                                  checked={!!user.isActive}
                                  onCheckedChange={() => handleToggle?.(user)}
                                  disabled={isPending}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Toggle to {user.isActive ? 'deactivate' : 'activate'} this user.
                              </p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleToggle?.(user)}
                                disabled={isPending}
                              >
                                {isPending
                                  ? 'Updating…'
                                  : user.isActive
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
            <div className="space-y-4 mt-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Email
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{safe(user.email)}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Phone
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{safe(user.phone)}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Address
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{safe(user.address)}</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground">
                <span>
                  Role: <strong className="text-foreground">{safe(user.role)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(user.createdAt)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}