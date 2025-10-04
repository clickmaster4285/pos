'use client';

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Search,
  Filter,
  Settings,
  History,
  UserPlus,
  UserMinus,
  UserCog,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Loader2,
} from 'lucide-react';

const ActionIcon = ({ action }) => {
  switch (action) {
    case 'created':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'deleted':
      return <UserMinus className="h-4 w-4 text-red-500" />;
    case 'updated':
      return <UserCog className="h-4 w-4 text-blue-500" />;
    case 'permission_changed':
      return <Settings className="h-4 w-4 text-amber-500" />;
    default:
      return null;
  }
};
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  return date.toLocaleDateString();
};

export const ActivityLog = ({ logs }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <History className="h-5 w-5" />
        Activity Log
      </CardTitle>
      <CardDescription>
        Recent permission changes and user actions
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
            <div className="mt-1">
              <ActionIcon action={log.action} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">
                {log.action === 'created' && 'Created User'}
                {log.action === 'deleted' && 'Deleted User'}
                {log.action === 'updated' && 'Updated User'}
                {log.action === 'permission_changed' && 'Permission Changed'}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {log.userName}
                </span>
                {' → '}
                <span className="font-medium text-foreground">
                  {log.target}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{log.details}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimestamp(log.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
