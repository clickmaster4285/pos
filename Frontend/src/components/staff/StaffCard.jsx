'use client';
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Edit,
  Shield,
  Trash2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

const StaffCard = ({
  member,
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

  // derive a capped list for stable height (no logic change, just UI usage)
  const permEntries = Object.entries(member.permissions || {}).filter(
    ([, v]) => !!v
  );
  const visiblePerms = permEntries.slice(0, 2);
  const restCount = Math.max(permEntries.length - 2, 0);

  return (
    <Card className="shadow-lg backdrop-blur-sm bg-card/80 border border-border/50 hover:shadow-glow transition-all duration-300">
      <CardHeader className="pb-3 min-h-[84px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar
              className="h-14 w-14 shrink-0 cursor-pointer"
              onClick={() => onRowClick?.(member)}
            >
              <AvatarFallback
                className={`text-white font-semibold ${getRoleColor(
                  member.subRole
                )} text-lg`}
              >
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>

            <div
              className="min-w-0 cursor-pointer"
              onClick={() => onRowClick?.(member)}
              title={member.name || ''}
            >
              <h3 className="text-xl font-semibold text-foreground truncate max-w-[220px]">
                {member.name}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`text-white font-medium ${getRoleColor(
                    member.subRole
                  )} px-2.5 py-0.5 h-6`}
                  title={member.subRole || ''}
                >
                  <span className="truncate max-w-[110px]">
                    {member.subRole}
                  </span>
                </Badge>

                <Badge
                  variant="outline"
                  className="px-2.5 py-0.5 h-6 text-muted-foreground border-border"
                  title={member.department || ''}
                >
                  <span className="truncate max-w-[120px]">
                    {member.department}
                  </span>
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 shrink-0"
              >
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-card/80 backdrop-blur-sm border border-border/50"
            >
              <DropdownMenuItem
                onClick={() => handleEditClick(member)}
                className="text-foreground hover:bg-primary/10 "
                disabled={!updatePermission}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-foreground hover:bg-primary/10"
                onClick={() => router.push(`/admin/permissions`)}
              >
                <Shield className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteStaff(member._id)}
                disabled={!deletePermission}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Staff
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact block: truncate to keep height steady */}
        <div className="space-y-2" onClick={() => onRowClick?.(member)}>
          <div
            className="flex items-center text-sm text-muted-foreground"
            title={member.email || ''}
          >
            <Mail className="mr-2 h-4 w-4 text-secondary-foreground shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          <div
            className="flex items-center text-sm text-muted-foreground"
            title={member.phone || 'N/A'}
          >
            <Phone className="mr-2 h-4 w-4 text-secondary-foreground shrink-0" />
            <span className="truncate">{member.phone || 'N/A'}</span>
          </div>
          <div
            className="flex items-center text-sm text-muted-foreground"
            title={member.address || 'N/A'}
          >
            <MapPin className="mr-2 h-4 w-4 text-secondary-foreground shrink-0" />
            <span className="truncate">{member.address || 'N/A'}</span>
          </div>
        </div>

        {/* Permissions block: one-line fixed height with neutral styling */}
        <div onClick={() => onRowClick?.(member)}>
          <Label className="text-xs font-medium text-foreground">
            Key Permissions
          </Label>

          <div
            className="mt-2 flex items-center gap-2 overflow-hidden"
            style={{ minHeight: 28, maxHeight: 28 }}
          >
            {visiblePerms.length > 0 ? (
              <>
                {visiblePerms.map(([key]) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className="text-xs h-7 leading-7  bg-muted text-primary px-2"
                    title={permissionLabels[key] || key}
                  >
                    <span className="truncate max-w-[140px]">
                      {permissionLabels[key] || key}
                    </span>
                  </Badge>
                ))}

                {restCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs h-7 leading-7 bg-muted/30  text-secondary-foreground px-2"
                    title={`${restCount} more`}
                  >
                    +{restCount} more
                  </Badge>
                )}
              </>
            ) : (
              <Badge
                variant="outline"
                className="text-xs h-7 leading-7 bg-background border-secondary text-secondary-foreground px-2"
              >
                No key permissions
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffCard;
