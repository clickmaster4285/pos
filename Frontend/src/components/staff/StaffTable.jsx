'use client';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Shield, Trash2 } from 'lucide-react';
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
  return (
    <div className="shadow-lg backdrop-blur-sm bg-card/80 border border-border/50 rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-foreground font-semibold">
              Staff Member
            </TableHead>
            <TableHead className="text-foreground font-semibold">
              Role
            </TableHead>
            <TableHead className="text-foreground font-semibold">
              Department
            </TableHead>
            <TableHead className="text-foreground font-semibold">
              Email
            </TableHead>
            <TableHead className="text-foreground font-semibold">
              Permissions
            </TableHead>
            <TableHead className="text-foreground font-semibold">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((member) => (
            <TableRow
              key={member._id}
              className="hover:bg-primary-foreground transition-all duration-300"
            >
              <TableCell
                className="flex items-center space-x-3"
                onClick={() => onRowClick?.(member)}
              >
                <Avatar className="h-10 w-10 ring-1 ring-primary/20">
                  <AvatarFallback
                    className={`text-white font-semibold ${getRoleColor(
                      member.subRole
                    )}`}
                  >
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {member.name}
                </span>
              </TableCell>
              <TableCell onClick={() => onRowClick?.(member)}>
                <Badge
                  className={`text-white ${getRoleColor(
                    member.subRole
                  )} px-3 py-1`}
                >
                  {member.subRole}
                </Badge>
              </TableCell>
              <TableCell
                className="text-muted-foreground"
                onClick={() => onRowClick?.(member)}
              >
                {member.department}
              </TableCell>
              <TableCell
                className="text-muted-foreground"
                onClick={() => onRowClick?.(member)}
              >
                {member.email}
              </TableCell>
              <TableCell onClick={() => onRowClick?.(member)}>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(member.permissions)
                    .filter(([_, value]) => value)
                    .slice(0, 2)
                    .map(([key, _]) => (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary"
                      >
                        {permissionLabels[key]}
                      </Badge>
                    ))}
                  {Object.values(member.permissions).filter(Boolean).length >
                    2 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-muted/50 text-muted-foreground"
                    >
                      +
                      {Object.values(member.permissions).filter(Boolean)
                        .length - 2}{' '}
                      more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-primary/10"
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
                      className="text-foreground hover:bg-primary/10"
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StaffTable;
