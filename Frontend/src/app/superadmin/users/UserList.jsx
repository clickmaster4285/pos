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
import { User, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';

const safe = (v) => (typeof v === 'string' ? v : '—');
const getId = (u) => u?.id ?? u?._id ?? u?.userId ?? '';

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject';
}

export function UserList({ items = [], handleToggle, pendingId }) {
  if (!items?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">
        No users found.
      </p>
    );
  }

  return (
    <Card className="divide-y border-border">
      <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="col-span-3">User</div>
        <div className="col-span-2">Email</div>
        <div className="col-span-2">Phone</div>
        <div className="col-span-3">Address</div>
        <div className="col-span-1 text-center">Status</div>
      </div>
      {items.map((u) => {
        const id = getId(u);
        const isPending = pendingId === id;

        return (
          <div
            key={id}
            className="grid grid-cols-12 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
          >
            <div className="col-span-12 sm:col-span-3 mb-2 sm:mb-0">
              <div className="flex items-start gap-2">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {safe(u.name)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {safe(u.role)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-6 sm:col-span-2 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{safe(u.email)}</span>
              </div>
            </div>
            <div className="col-span-6 sm:col-span-2 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{safe(u.phone)}</span>
              </div>
            </div>
            <div className="col-span-12 sm:col-span-3 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <MapPin className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{safe(u.address)}</span>
              </div>
            </div>
            <div className="col-span-3 sm:col-span-1 flex items-center justify-center">
              <Badge
                variant={statusVariant(!!u.isActive)}
                className="h-6 px-2 text-[10px]"
              >
                {u.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="col-span-3 sm:col-span-1">
              <div className="flex justify-start sm:justify-end gap-1">
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
                              checked={!!u.isActive}
                              onCheckedChange={() => handleToggle?.(u)}
                              disabled={!!isPending}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Toggle to {u.isActive ? 'deactivate' : 'activate'} this user.
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleToggle?.(u)}
                            disabled={!!isPending}
                          >
                            {isPending
                              ? 'Updating…'
                              : u.isActive
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