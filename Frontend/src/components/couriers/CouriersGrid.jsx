'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import Pagination from '../ui/Pagination';
import {
  useGetCouriersQuery,
  useCreateCourierMutation,
  useUpdateCourierMutation,
  useDeleteCourierMutation,
  useUpdateCourierCredentialsMutation,
  useAuthTestCourierMutation,
} from '@/features/couriersApi';

import { CreateCourierModal } from './CreateCourierModal';
import { CredentialsModal } from './CredentialsModal';
import { FeedbackModal } from './AuthCheck';

const ENV_OPTIONS = ['Production', 'Sandbox'];
const STATUS_OPTIONS = ['Connected', 'Not Connected'];

export function CouriersGrid({ companyId }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [credsOpen, setCredsOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // pick your default

  const { data, isLoading, isError, refetch } = useGetCouriersQuery();
  const [createCourier, { isLoading: isCreating }] = useCreateCourierMutation();
  const [updateCourier, { isLoading: isUpdating }] = useUpdateCourierMutation();
  const [deleteCourier, { isLoading: isDeleting }] = useDeleteCourierMutation();
  const [updateCreds] = useUpdateCourierCredentialsMutation();
  const [authTest, { isLoading: isTesting }] = useAuthTestCourierMutation();

  const couriers = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }, [data]);

  const total = couriers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pagedCouriers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return couriers.slice(start, start + pageSize);
  }, [couriers, page, pageSize]);

  // reset to page 1 when data or page size changes
  useEffect(() => {
    setPage(1);
  }, [couriers, pageSize]);

  const [fb, setFb] = React.useState({
    open: false,
    title: '',
    description: '',
    variant: 'success', // 'success' | 'error'
  });
  const idOf = (c) => c._id || c.id;

  const safeUpdate = async (id, patch, okMsg = 'Updated') => {
    try {
      await updateCourier({ id, ...patch }).unwrap();

      refetch();
    } catch (e) {
      alert(e.message);
    }
  };

  const onEnvPick = (c, environment) =>
    safeUpdate(idOf(c), { environment }, 'Environment updated');
  const onStatusPick = (c, status) =>
    safeUpdate(idOf(c), { status }, 'Status updated');
  const onToggleActive = (c, next) =>
    safeUpdate(idOf(c), { isActive: next }, 'Active state updated');

  const remove = async (c) => {
    try {
      await deleteCourier({ id: idOf(c) }).unwrap();

      refetch();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreate = async (payload) => {
    try {
      await createCourier(payload).unwrap();
      setCreateOpen(false);

      refetch();
    } catch (e) {
      alert(e.message);
    }
  };

  const openCredsModal = (courier) => {
    setEditingCourier(courier);
    setCredsOpen(true);
  };

  const handleSaveCreds = async (values) => {
    if (!editingCourier) return;
    try {
      await updateCreds({
        id: idOf(editingCourier),
        companyId,
        ...values,
      }).unwrap();

      setCredsOpen(false);
      setEditingCourier(null);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAuthTest = async (c) => {
    try {
      await authTest({ id: c._id }).unwrap();
      setFb({
        open: true,
        title: 'Auth successful',
        description: `${c.name} is reachable.`,

        variant: 'success',
      });
      refetch();
    } catch (e) {
      setFb({
        open: true,
        title: 'Auth failed',
        description:
          e?.data?.message ||
          e?.error ||
          e?.message ||
          'Unable to verify connection.',
        variant: 'error',
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-medium">Couriers</div>
          <div className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading...'
              : isError
              ? 'Failed to load couriers'
              : `${couriers.length} courier${couriers.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <Button
          variant="header"
          onClick={() => setCreateOpen(true)}
          disabled={isCreating}
        >
          {isCreating ? 'Adding…' : 'Add Courier'}
        </Button>
      </div>

      {isError ? (
        <div className="text-sm text-red-600">
          Could not fetch couriers. Try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <Card key={`skeleton-${idx}`} className="border">
                <CardContent className="p-4 space-y-4">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="flex justify-between items-center">
                    <div className="h-9 w-24 bg-muted rounded" />
                    <div className="h-9 w-9 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : pagedCouriers.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              No couriers found.
            </div>
          ) : (
            pagedCouriers.map((c) => (
              <Card key={idOf(c)} className="border relative">
                {/* 3-dot menu in top-right corner */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="More actions"
                      >
                        ⋯
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {/* Change Environment */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Change Environment
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {ENV_OPTIONS.map((e) => (
                            <DropdownMenuItem
                              key={e}
                              onClick={() => onEnvPick(c, e)}
                              disabled={isUpdating}
                            >
                              {e}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {/* Manage credentials */}
                      <DropdownMenuItem onClick={() => openCredsModal(c)}>
                        Manage Credentials
                      </DropdownMenuItem>

                      {/* Test connection */}
                      <DropdownMenuItem
                        onClick={() => handleAuthTest(c)}
                        disabled={isTesting}
                      >
                        {isTesting ? 'Testing…' : 'Test Connection'}
                      </DropdownMenuItem>

                      {/* Active toggle */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Active</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56">
                          <DropdownMenuItem asChild>
                            <div className="flex items-center justify-between gap-3">
                              <span>
                                {c?.isActive ? 'Set Inactive' : 'Set Active'}
                              </span>
                              <Switch
                                checked={!!c?.isActive}
                                onCheckedChange={(next) =>
                                  onToggleActive(c, next)
                                }
                                disabled={isUpdating}
                              />
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => remove(c)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Code</div>
                      <div className="font-medium">{c.code}</div>

                      <div className="text-sm text-muted-foreground mt-2">
                        Name
                      </div>
                      <div className="font-medium">{c.name}</div>

                      <div className="text-sm text-muted-foreground mt-2">
                        Max Weight
                      </div>
                      <div className="font-medium">
                        {c.maxWeightKg != null ? `${c.maxWeightKg} kg` : '—'}
                      </div>

                      {typeof c.hasCredentials !== 'undefined' && (
                        <>
                          <div className="text-sm text-muted-foreground mt-2">
                            Credentials
                          </div>
                          <div className="font-medium">
                            {c.hasCredentials ? 'Set' : 'Not Set'}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="secondary"
                        className={`px-2 py-0.5 rounded-md ${
                          (c.status || '').toLowerCase() === 'connected'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {c.status || 'Not Connected'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 rounded-md"
                      >
                        {c.environment || 'Production'}
                      </Badge>
                      <Badge
                        variant={c?.isActive ? 'default' : 'secondary'}
                        className="px-2 py-0.5 rounded-md"
                      >
                        {c?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="mt-3">
          <div className="text-sm text-muted-foreground mb-2">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, total)} of {total} couriers
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </div>
      )}

      <CreateCourierModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      {editingCourier && (
        <CredentialsModal
          open={credsOpen}
          onOpenChange={(v) => {
            setCredsOpen(v);
            if (!v) setEditingCourier(null);
          }}
          courier={editingCourier}
          onSave={handleSaveCreds}
        />
      )}

      <FeedbackModal
        open={fb.open}
        onOpenChange={(v) => setFb((s) => ({ ...s, open: v }))}
        title={fb.title}
        description={fb.description}
        variant={fb.variant}
      />
    </>
  );
}
