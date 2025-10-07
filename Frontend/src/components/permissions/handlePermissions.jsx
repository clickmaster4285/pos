'use client';

import React, { useMemo, useState, useContext } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';

import {
  useGetAllStaffQuery,
  useUpdateStaffMutation,
} from '@/features/staffApi';

import { useGetAllActivityQuery } from '@/features/activeLogApi';

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
import { AuthContext } from '@/components/auth/SecureAuthProvider';

/* --------------------------- helpers --------------------------- */
const shortId = (id) => (id ? String(id).slice(-6) : '—');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const normalizeActionFromText = (raw = '') => {
  const t = String(raw).toLowerCase();
  if (t.includes('permission')) return 'permission_changed';
  if (t.includes('deleted') || t.includes('removed') || t.includes('archiv'))
    return 'deleted';
  if (t.includes('created') || t.startsWith('created')) return 'created';
  return 'updated';
};

const prettyEntity = (e) => {
  const k = String(e || '').toLowerCase();
  if (k === 'user' || k === 'staff') return 'User';
  if (k === 'vendor') return 'Vendor';
  if (k === 'bill') return 'Bill';
  if (k === 'order') return 'Order';
  if (k === 'inventory') return 'Inventory';
  if (k === 'company') return 'Company';
  return cap(k || 'Item');
};
/* -------------------------------------------------------------- */

export function HandlePermissions() {
  const { data: staff = [], isLoading } = useGetAllStaffQuery();
  const [updateStaff] = useUpdateStaffMutation();

  const { user: authUser } = useContext(AuthContext) || {};

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);
  const [detailsInitialTab, setDetailsInitialTab] = useState('profile');

  // open History directly
  const openHistory = (user) => {
    setDetailsUser(user);
    setDetailsInitialTab('history');
    setDetailsOpen(true);
  };

  /* ------------------- ID -> Name lookup (users) ------------------- */
  const idToName = useMemo(() => {
    const map = new Map();
    const add = (u) => {
      if (!u) return;
      const label = u?.name || u?.email || u?.userId || 'admin';
      if (u?.userId) map.set(String(u.userId), label); // platform userId
      if (u?._id) map.set(String(u._id), label); // mongo id
    };
    (Array.isArray(staff) ? staff : []).forEach(add);
    add(authUser);
    return map;
  }, [staff, authUser]);

  const nameFor = (id) => idToName.get(String(id)) || 'admin';

  /* ------------------- Staff-based activity (fallback) ------------------- */
  const activityLog = useMemo(() => {
    const logs = (staff || []).flatMap((u) =>
      (u?.history || []).map((h, idx) => ({
        id: `${getUserId(u)}-${idx}`,
        userId: getUserId(u),
        userName: nameFor(getUserId(u)),
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
  }, [staff, nameFor]);

  /* ------------------- Server activity (preferred) ------------------- */
  const { data: activityRes, isFetching: isFetchingActivity } =
    useGetAllActivityQuery(
      { companyId: authUser?.companyId || 'CMNO2VU8' },
      {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        pollingInterval: 30000, // auto-refresh
      }
    );

  const apiLogs = useMemo(() => {
    const raw = activityRes?.data || [];
    const mapped = raw.map((e, i) => {
      const action = normalizeActionFromText(e.action);
      const entityLabel = prettyEntity(e.entity);
      const idStr = String(e.entityId || '');
      const itemLabel = e.entityName || `${entityLabel} #${shortId(idStr)}`;
      const target = `${entityLabel} → ${itemLabel}`;
      const rawActorId = e.performedBy || e.createdBy || 'unknown';
      const actorName = e.actorName || nameFor(rawActorId);

      return {
        id: `${e.entity}-${e.entityId}-${e.at}-${i}`,
        userId: rawActorId,
        userName: actorName || 'admin',
        action,
        target,
        timestamp: e.at || e.createdAt || new Date().toISOString(),
        details: e.action || '',
      };
    });

    return mapped.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [activityRes, nameFor]);

  const logsToShow = apiLogs.length ? apiLogs : activityLog;

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
    setDetailsInitialTab('profile');
  };

  const handleTogglePermission = async (
    userId,
    key,
    current,
    allPerms = {},
    user
  ) => {
    const nextPermissions = { ...allPerms, [key]: !current };

    const isSelected = selectedUser && getUserId(selectedUser) === userId;
    const isDetails = detailsUser && getUserId(detailsUser) === userId;
    if (isSelected)
      setSelectedUser((prev) => ({ ...prev, permissions: nextPermissions }));
    if (isDetails)
      setDetailsUser((prev) => ({ ...prev, permissions: nextPermissions }));

    try {
      await updateStaff({ _id: userId, permissions: nextPermissions }).unwrap();
      toast.success('Permission Updated', {
        description: `${key} → ${
          nextPermissions[key] ? 'enabled' : 'disabled'
        }`,
      });
    } catch (err) {
      if (isSelected) setSelectedUser(user);
      if (isDetails) setDetailsUser(user);
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
              onShowHistory={openHistory}
            />
          </Card>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-1">
          <ActivityLog logs={logsToShow} isLoading={isFetchingActivity} />
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
        companyId={authUser?.companyId || 'CMNO2VU8'}
        initialTab={detailsInitialTab}
      />
    </div>
  );
}
