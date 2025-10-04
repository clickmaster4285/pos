'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';
import {
  useGetAllStaffQuery,
  useUpdateStaffMutation,
} from '@/features/staffApi';

import { ActivityLog } from '@/components/permissions/ActiveLog';
import {
  StatsCards,
  FiltersBar,
  PageHeader,
} from '@/components/permissions/pageHeader';

import UsersTable from './UsersTable';
import UserDetailsSheet from './UserDetailsSheet';
import PermissionDialog from './PermissionDialog';

import { humanize, normalizeAction, getUserId } from './helpers';

export  function HandlePermissions() {
  const { data: staff = [], isLoading } = useGetAllStaffQuery();
  const [updateStaff] = useUpdateStaffMutation();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);

  // Build permission labels dynamically (fallback if none)
  const permissionLabels = useMemo(() => {
    const keySet = new Set();
    (staff || []).forEach((u) => {
      Object.keys(u?.permissions || {}).forEach((k) => keySet.add(k));
    });
    const keys = Array.from(keySet);
    if (keys.length === 0) {
      const fallback = [
        'approveRequests',
        'assignTasks',
        'manageAppointments',
        'manageInventory',
        'managePlans',
        'manageTeams',
        'manageVendors',
        'staffCreate',
        'staffDelete',
        'staffUpdate',
        'viewReports',
        'viewallstaff',
      ];
      return Object.fromEntries(fallback.map((k) => [k, humanize(k)]));
    }
    return Object.fromEntries(keys.map((k) => [k, humanize(k)]));
  }, [staff]);

  // Activity log
  const activityLog = useMemo(() => {
    const logs = (staff || []).flatMap((u) =>
      (u?.history || []).map((h, idx) => ({
        id: `${getUserId(u)}-${idx}`,
        userId: getUserId(u),
        userName: u?.name || u?.email || u?.userId || 'User',
        action: normalizeAction(h?.action || ''),
        target: u?.name || u?.email || '—',
        timestamp:
          h?.createdAt ||
          u?.updatedAt ||
          u?.createdAt ||
          new Date().toISOString(),
        details: h?.action || 'Updated',
      }))
    );
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [staff]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (staff || []).filter((user) => {
      const name = (user?.name || '').toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const matchesSearch = name.includes(q) || email.includes(q);

      const matchesRole =
        roleFilter === 'all' ||
        user?.role === roleFilter ||
        user?.subRole === roleFilter;

      const perms = user?.permissions || {};
      const matchesPermission =
        permissionFilter === 'all' || !!perms[permissionFilter];

      return matchesSearch && matchesRole && matchesPermission;
    });
  }, [staff, searchQuery, roleFilter, permissionFilter]);

  // handlers
  const openUserDialog = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const openDetails = (user) => {
    setDetailsUser(user);
    setDetailsOpen(true);
  };

  // const handleTogglePermission = async (userId, key, current, allPerms) => {
  //   try {
  //     const nextPermissions = { ...(allPerms || {}), [key]: !current };
  //     await updateStaff({ id: userId, permissions: nextPermissions }).unwrap();
  //     toast.success('Permission Updated', { description: 'Saved to server' });
  //   } catch (err) {
  //     console.error('Permission update failed:', err);
  //     toast.error('Update failed', {
  //       description:
  //         err?.data?.message || err?.message || 'Could not update permission.',
  //     });
  //   }
  // };

  // Call shape matches your API: updateStaff({ _id, ...staffData })
  const handleTogglePermission = async (
    userId,
    key,
    current,
    allPerms = {},
    user
  ) => {
    // Build the next permissions object
    const nextPermissions = { ...allPerms, [key]: !current };

    // (optional) optimistic UI
    const isSelected = selectedUser && getUserId(selectedUser) === userId;
    const isDetails = detailsUser && getUserId(detailsUser) === userId;
    if (isSelected)
      setSelectedUser((prev) => ({ ...prev, permissions: nextPermissions }));
    if (isDetails)
      setDetailsUser((prev) => ({ ...prev, permissions: nextPermissions }));

    try {
      // IMPORTANT: permissions must be nested, don't spread into root
      await updateStaff({ _id: userId, permissions: nextPermissions }).unwrap();
      toast.success('Permission Updated', {
        description: `${key} → ${
          nextPermissions[key] ? 'enabled' : 'disabled'
        }`,
      });
    } catch (err) {
      // revert optimistic UI on failure
      if (isSelected) setSelectedUser(user);
      if (isDetails) setDetailsUser(user);
      console.error('Permission update failed:', err);
      toast.error('Update failed', {
        description:
          err?.data?.message || err?.message || 'Could not update permission.',
      });
    }
  };

  return (
    <div className="mx-auto p-6 max-w-full">
      <Toaster position="top-right" richColors />

      <PageHeader />
      <StatsCards
        isLoading={isLoading}
        staff={staff}
        activityLog={activityLog}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table + Filters */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <FiltersBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                permissionFilter={permissionFilter}
                setPermissionFilter={setPermissionFilter}
                permissionLabels={permissionLabels}
              />
            </CardHeader>

            <UsersTable
              isLoading={isLoading}
              filteredUsers={filteredUsers}
              onOpenUser={openUserDialog}
              onShowDetails={openDetails}
            />
          </Card>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-1">
          <ActivityLog logs={activityLog} />
        </div>
      </div>

      {/* Manage Permissions Dialog */}
      <PermissionDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onToggle={handleTogglePermission}
        permissionLabels={permissionLabels}
      />

      {/* Right-side User Details Sheet */}
      <UserDetailsSheet
        user={detailsUser}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        permissionLabels={permissionLabels}
        onManage={(u) => {
          setDetailsOpen(false);
          openUserDialog(u);
        }}
      />
    </div>
  );
}
