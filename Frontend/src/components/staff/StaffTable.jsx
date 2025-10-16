'use client';
import React from 'react';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Edit,
  Shield,
  Trash2,
  Mail,
  Building2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const StaffTable = ({
  staff,
  handleEditClick,
  handleDeleteStaff,
  getRoleColor,
  getInitials,
  permissionLabels,
  updatePermission,
  deletePermission,
  onRowClick,
}) => {
  const router = useRouter();
  if (!staff?.length) {
    return (
      <p className="text-center text-muted-foreground py-6">
        No staff members found.
      </p>
    );
  }

  return (
    <Card className="divide-y border-border shadow-sm bg-card/80 backdrop-blur-sm">
      {/* Header row */}
      <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="col-span-3">Staff Member</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-2">Department</div>
        <div className="col-span-3">Email</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Rows */}
      {staff.map((member) => {
        const perms = Object.entries(member.permissions || {}).filter(
          ([, v]) => !!v
        );
        const visible = perms.slice(0, 2);
        const extraCount = Math.max(perms.length - visible.length, 0);

        return (
          <div
            key={member._id}
            className="grid grid-cols-12 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
          >
            {/* Staff Member */}
            <div
              className="col-span-12 sm:col-span-3 mb-2 sm:mb-0 cursor-pointer"
              onClick={() => onRowClick?.(member)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 ring-1 ring-primary/20 shrink-0">
                  <AvatarFallback
                    className={`text-white font-semibold ${getRoleColor(
                      member.subRole
                    )}`}
                  >
                    {getInitials?.(member.name) ?? 'NA'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {member.name}
                  </p>
                  {member.permissions && (
                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                      {visible.map(([key]) => (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="text-[10px] bg-primary/10 text-primary"
                        >
                          {permissionLabels[key] || key}
                        </Badge>
                      ))}

                      {extraCount > 0 && (
                        <HoverCard openDelay={80} closeDelay={80}>
                          <HoverCardTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-muted/50 text-muted-foreground cursor-default"
                            >
                              +{extraCount} more
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64 text-xs">
                            <p className="mb-2 font-medium text-foreground">
                              All permissions
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {perms.map(([key]) => (
                                <Badge
                                  key={key}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {permissionLabels[key] || key}
                                </Badge>
                              ))}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role */}
            <div
              className="col-span-6 sm:col-span-2 mb-2 sm:mb-0 cursor-pointer"
              onClick={() => onRowClick?.(member)}
            >
              <Badge
                className={`px-2 h-6 sm text-white ${getRoleColor(
                  member.subRole
                )}`}
              >
                {member.subRole}
              </Badge>
            </div>

            {/* Department */}
            <div
              className="col-span-6 sm:col-span-2 mb-2 sm:mb-0 cursor-pointer"
              onClick={() => onRowClick?.(member)}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                <Building2 className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{member.department || '—'}</span>
              </div>
            </div>

            {/* Email */}
            <div
              className="col-span-12 sm:col-span-3 mb-2 sm:mb-0 cursor-pointer"
              onClick={() => onRowClick?.(member)}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                <Mail className="h-3 w-3 shrink-0 text-secondary-foreground" />
                <span className="truncate">{member.email}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-12 sm:col-span-2">
              <div className="flex justify-start sm:justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditClick?.(member)}
                  className="h-8 w-8 p-0 hover:bg-accent"
                  aria-label="Edit staff"
                  disabled={!updatePermission}
                >
                  <Edit className="h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  variant="delete"
                  onClick={() => handleDeleteStaff?.(member._id)}
                  className="h-8 w-8 p-0"
                  aria-label="Delete staff"
                  disabled={!deletePermission}
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
                    <DropdownMenuItem
                      onClick={() => handleEditClick?.(member)}
                      className="text-foreground"
                      disabled={!updatePermission}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-foreground"
                      onClick={() => router.push('/admin/permissions')}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteStaff?.(member._id)}
                      disabled={!deletePermission}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Staff
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
};

export default StaffTable;
