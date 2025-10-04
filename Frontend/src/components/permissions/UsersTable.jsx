'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Loader2, Settings, CheckCircle2, XCircle } from 'lucide-react';
import { countActivePermissions, getUserId, isUserActive } from './helpers';

export default function UsersTable({
  isLoading,
  filteredUsers,
  onOpenUser,
  onShowDetails,
}) {
  return (
    <div className="px-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading staff…
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const userId = getUserId(user);
                  const active = isUserActive(user);
                  const roleLabel = user?.subRole || user?.role || '—';
                  const perms = user?.permissions || {};
                  const totalPerms = Object.keys(perms).length || 0;

                  return (
                    <TableRow
                      key={userId}
                      onClick={() => onShowDetails(user)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">
                              {user?.name || 'Unnamed'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        {active ? (
                          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {countActivePermissions(perms)}/{totalPerms || '—'}{' '}
                          enabled
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenUser(user);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your filters
            </div>
          )}
        </>
      )}
    </div>
  );
}
