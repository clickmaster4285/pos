'use client';

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  History,
  UserPlus,
  UserMinus,
  UserCog,
  Settings,
  Clock,
  Loader2,
} from 'lucide-react';

const ActionIcon = ({ action }) => {
  switch (action) {
    case 'created':
      return <UserPlus className="h-4 w-4 text-secondary-foreground" />;
    case 'deleted':
      return <UserMinus className="h-4 w-4 text-destructive" />;
    case 'updated':
      return <UserCog className="h-4 w-4 text-primary" />;
    case 'permission_changed':
      return <Settings className="h-4 w-4 text-amber-500" />;
    default:
      return null;
  }
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  return date.toLocaleDateString();
};

export const ActivityLog = ({
  logs = [],
  isLoading = false,
  initialCount = 7,
}) => {
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => {
    if (expanded) return logs;
    return logs.slice(0, initialCount);
  }, [logs, expanded, initialCount]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Recent permission changes and user actions
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {!expanded && logs.length > initialCount ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setExpanded(true)}
            >
              See all ({logs.length})
            </Button>
          ) : logs.length > initialCount ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExpanded(false)}
            >
              See less
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activity…
          </div>
        ) : visible.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <div className="space-y-4">
            {visible.map((log) => (
              <div
                key={log.id}
                className="flex gap-3 pb-4 border-b last:border-0"
              >
                <div className="mt-1">
                  <ActionIcon action={log.action} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-medium capitalize">
                    {log.action.replace('_', ' ')}
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
                  {log.details ? (
                    <div className="text-xs text-muted-foreground">
                      {log.details}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
