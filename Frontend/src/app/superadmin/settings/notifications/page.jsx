'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  useGetUserQuery,
  useNotificationPreferencesMutation,
} from '@/features/authApi';

// Hardcoded descriptions for notification fields (JS object, no TS types)
const NOTIFICATION_DESCRIPTIONS = {
  'email.postPublished':
    'Get notified when a new post is successfully published.',
  'email.postFailed': 'Receive alerts when a post fails to publish.',
  'email.weeklyReport': 'Receive a weekly summary of your account activity.',
  'email.accountDisconnected':
    'Get notified if your account is disconnected or logged out.',
  'email.securityAlerts':
    'Receive alerts for suspicious activity or security issues.',
};

function toTitleCase(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeItem(val) {
  if (typeof val === 'boolean') return { enabled: val, frequency: null };
  if (val && typeof val === 'object') {
    const enabled =
      typeof val.enabled === 'boolean'
        ? val.enabled
        : typeof val.value === 'boolean'
        ? val.value
        : false;
    const frequency = typeof val.frequency === 'string' ? val.frequency : null;
    return { enabled, frequency };
  }
  return { enabled: false, frequency: null };
}

export default function NotificationsPage() {
  const { data: user, isLoading, isError, refetch } = useGetUserQuery();
  const [runUpdate, { isLoading: saving }] =
    useNotificationPreferencesMutation();

  const initialFromBackend = useMemo(() => {
    const base = { channels: [], flat: {}, original: {} };
    const np = user?.notificationPreferences;
    if (!np || typeof np !== 'object') return base;

    const channels = Object.keys(np);
    const flat = {};
    const original = {};

    for (const channel of channels) {
      const channelObj = np[channel] || {};
      original[channel] = channelObj;

      for (const key of Object.keys(channelObj)) {
        flat[`${channel}.${key}`] = normalizeItem(channelObj[key]);
      }
    }
    return { channels, flat, original };
  }, [user]);

  const [prefs, setPrefs] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setPrefs(initialFromBackend.flat);
    setDirty(false);
  }, [initialFromBackend.flat]);

  const setToggle = (fullKey, value) => {
    setPrefs((p) => {
      const next = {
        ...p,
        [fullKey]: {
          ...(p[fullKey] || { enabled: false, frequency: null }),
          enabled: value,
        },
      };
      return next;
    });
    setDirty(true);
  };

  const setFrequency = (fullKey, value) => {
    setPrefs((p) => {
      const next = {
        ...p,
        [fullKey]: {
          ...(p[fullKey] || { enabled: false, frequency: null }),
          frequency: value,
        },
      };
      return next;
    });
    setDirty(true);
  };

  const buildPayload = () => {
    const nested = { email: {} };
    Object.entries(prefs).forEach(([fullKey, norm]) => {
      const [channel, key] = fullKey.split('.');
      if (channel !== 'email' || !key) return;
      nested.email[key] = !!norm.enabled; // boolean schema
    });
    return { notificationPreferences: nested };
  };

  const handleSave = async () => {
    try {
      const body = buildPayload();
      const resp = await runUpdate(body).unwrap();
      const updated =
        resp?.data?.notificationPreferences ||
        resp?.data ||
        user?.notificationPreferences;

      if (updated) {
        const nextFlat = {};
        for (const ch of Object.keys(updated)) {
          for (const k of Object.keys(updated[ch] || {})) {
            nextFlat[`${ch}.${k}`] = normalizeItem(updated[ch][k]);
          }
        }
        setPrefs(nextFlat);
      }
      setDirty(false);
      refetch();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  if (isLoading) return <div className="p-4">Loading…</div>;
  if (isError) return <div className="p-4">Failed to load user.</div>;
  if (!user?.notificationPreferences)
    return <div className="p-4">No notification settings found.</div>;

  return (
    <div className="max-w-4xl mt-2 mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button disabled={!dirty || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </header>

      {initialFromBackend.channels
        .filter((channel) => channel === 'email') // 👈 only keep email
        .map((channel) => {
          const items = Object.keys(initialFromBackend.original[channel] || {});
          return (
            <Card key={channel}>
              <div className="px-5 -py-8 font-bold capitalize">
                Email Notifications
              </div>
              <CardContent className="divide-y">
                {items.length === 0 && (
                  <div className="py-4 text-sm text-muted-foreground">
                    No settings in this channel.
                  </div>
                )}

                {items.map((itemKey) => {
                  const fullKey = `${channel}.${itemKey}`;
                  const norm = prefs[fullKey] || {
                    enabled: false,
                    frequency: null,
                  };
                  const hasFrequency = norm.frequency !== null;

                  return (
                    <div
                      key={fullKey}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <div className="font-medium break-words">
                          {toTitleCase(itemKey)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {NOTIFICATION_DESCRIPTIONS[fullKey] ||
                            'No description available.'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={!!norm.enabled}
                          onCheckedChange={(v) => setToggle(fullKey, v)}
                          className="data-[state=checked]:bg-primary"
                        />

                        {hasFrequency && (
                          <Select
                            value={norm.frequency || 'off'}
                            onValueChange={(v) => setFrequency(fullKey, v)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="off">Off</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
