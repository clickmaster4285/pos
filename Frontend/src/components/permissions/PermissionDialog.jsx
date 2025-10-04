'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { getUserId } from './helpers';

export default function PermissionDialog({
  user,
  open,
  onOpenChange,
  onToggle,
  permissionLabels = {},
}) {
  // ➜ Hooks must run on every render (no early returns above these)
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'enabled' | 'disabled'

  // Safe fallbacks if user is not ready yet
  const safeUser = user ?? { name: '', permissions: {} };
  const userId = getUserId(safeUser);
  const perms = safeUser.permissions || {};

  const filteredPermissions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return Object.entries(permissionLabels).filter(([key, label]) => {
      const matchesSearch =
        (label || '').toLowerCase().includes(term) ||
        (key || '').toLowerCase().includes(term);

      const isEnabled = !!perms[key];
      const matchesFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'enabled'
          ? isEnabled
          : activeFilter === 'disabled'
          ? !isEnabled
          : true;

      return matchesSearch && matchesFilter;
    });
  }, [permissionLabels, searchTerm, activeFilter, perms]);

  const enabledCount = Object.values(perms).filter(Boolean).length;
  const totalCount = Object.keys(permissionLabels).length;

  const handleOpenChange = (nextOpen) => {
    setSearchTerm('');
    setActiveFilter('all');
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Manage Permissions
                <Badge variant="secondary" className="text-sm font-normal">
                  {safeUser.name || '—'}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Configure individual permissions for this user. {enabledCount}{' '}
                of {totalCount} permissions enabled.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 p-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Badge
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveFilter('all')}
            >
              All
            </Badge>
            <Badge
              variant={activeFilter === 'enabled' ? 'default' : 'outline'}
              className="cursor-pointer gap-1"
              onClick={() => setActiveFilter('enabled')}
            >
              <CheckCircle2 className="h-3 w-3" />
              Enabled
            </Badge>
            <Badge
              variant={activeFilter === 'disabled' ? 'default' : 'outline'}
              className="cursor-pointer gap-1"
              onClick={() => setActiveFilter('disabled')}
            >
              <XCircle className="h-3 w-3" />
              Disabled
            </Badge>
          </div>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          {user == null ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Loading user…</p>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No permissions found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          ) : (
            filteredPermissions.map(([key, label]) => {
              const isOn = !!perms[key];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                    isOn
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                      : 'bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-full mt-0.5 ${
                        isOn
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`${userId}-${key}`}
                        className="cursor-pointer font-medium text-sm block"
                      >
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {key}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge
                      variant="outline"
                      className={
                        isOn
                          ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300'
                          : 'text-muted-foreground'
                      }
                    >
                      {isOn ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Switch
                      id={`${userId}-${key}`}
                      checked={isOn}
                      onCheckedChange={() =>
                        onToggle(userId, key, !!perms[key], perms, user)
                      }
                      className={
                        isOn ? 'data-[state=checked]:bg-green-600' : ''
                      }
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
          <span>
            Showing {user ? filteredPermissions.length : 0} of {totalCount}{' '}
            permissions
          </span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {enabledCount} enabled
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              {totalCount - enabledCount} disabled
            </span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
