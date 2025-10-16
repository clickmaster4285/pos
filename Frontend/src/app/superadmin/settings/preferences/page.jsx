'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, RotateCcw, Globe } from 'lucide-react';
import {
  useGetUserQuery,
  useUpdatePreferencesMutation,
} from '@/features/authApi';

export default function PreferencesPage() {
  const { data: user, isLoading, isError, refetch } = useGetUserQuery();
  const [updatePreferences, { isLoading: saving }] =
    useUpdatePreferencesMutation();

  // Detect browser TZ; fall back to Asia/Karachi
  const browserTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi';
    } catch {
      return 'Asia/Karachi';
    }
  })();

  // Helpers
  const cityFromTz = (tz) => (tz.split('/').pop() || tz).replace(/_/g, ' ');
  const offsetForTz = (tz) => {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset',
      });
      const parts = fmt.formatToParts(now);
      const off = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT';
      return off.replace('UTC', 'GMT');
    } catch {
      return 'GMT';
    }
  };

  // Curated list
  const tzOptions = [
    { tz: 'Asia/Karachi', flag: '🇵🇰' },
    { tz: 'Asia/Dubai', flag: '🇦🇪' },
    { tz: 'Asia/Kolkata', flag: '🇮🇳' },
    { tz: 'Europe/London', flag: '🇬🇧' },
    { tz: 'Europe/Berlin', flag: '🇩🇪' },
    { tz: 'Europe/Paris', flag: '🇫🇷' },
    { tz: 'Europe/Madrid', flag: '🇪🇸' },
    { tz: 'Europe/Rome', flag: '🇮🇹' },
    { tz: 'Europe/Amsterdam', flag: '🇳🇱' },
    { tz: 'Europe/Moscow', flag: '🇷🇺' },
    { tz: 'Europe/Istanbul', flag: '🇹🇷' },
    { tz: 'America/New_York', flag: '🇺🇸' },
    { tz: 'America/Chicago', flag: '🇺🇸' },
    { tz: 'America/Denver', flag: '🇺🇸' },
    { tz: 'America/Los_Angeles', flag: '🇺🇸' },
    { tz: 'Australia/Sydney', flag: '🇦🇺' },
    { tz: 'Pacific/Auckland', flag: '🇳🇿' },
    { tz: 'Pacific/Fiji', flag: '🇫🇯' },
    { tz: 'UTC', flag: '🌍' },
  ].map((o) => ({ ...o, gmt: offsetForTz(o.tz), city: cityFromTz(o.tz) }));

  const defaults = {
    timezone: browserTz,
    timeFormat: '12h',
    startOfWeek: 'monday',
    defaultPostTime: '09:00',
    schedulingFrequency: 'optimal',
  };

  const [prefs, setPrefs] = useState(defaults);
  const [savedPrefs, setSavedPrefs] = useState(defaults);

  // Hydrate from server
  useEffect(() => {
    if (!user) return;
    const next = {
      timezone: user.timezone || browserTz,
      timeFormat: user.timeFormat || '12h',
      startOfWeek: user.startOfWeek || 'monday',
      defaultPostTime: user.defaultPostTime || '09:00',
      schedulingFrequency: user.schedulingFrequency || 'optimal',
    };
    setPrefs(next);
    setSavedPrefs(next);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(savedPrefs),
    [prefs, savedPrefs]
  );

  const previewTime = useMemo(() => {
    const [hh, mm] = (prefs.defaultPostTime || '09:00').split(':').map(Number);
    const d = new Date();
    d.setHours(hh || 9, mm || 0, 0, 0);
    try {
      const fmt = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: prefs.timeFormat === '12h',
        timeZone: prefs.timezone,
      }).format(d);
      const city = cityFromTz(prefs.timezone);
      return `${fmt} (${city})`;
    } catch {
      return `${prefs.defaultPostTime} (${cityFromTz(prefs.timezone)})`;
    }
  }, [prefs.defaultPostTime, prefs.timezone, prefs.timeFormat]);

  const handleSave = async () => {
    try {
      const body = {
        timezone: prefs.timezone,
        timeFormat: prefs.timeFormat,
        startOfWeek: prefs.startOfWeek,
        defaultPostTime: prefs.defaultPostTime, // HH:mm
        schedulingFrequency: prefs.schedulingFrequency,
      };
      const resp = await updatePreferences(body).unwrap();
      const next = resp?.data || body; // handle either shaped response
      setSavedPrefs(next);
      setPrefs(next);
      refetch();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleReset = () => setPrefs(savedPrefs);

  const selectedTz = tzOptions.find((o) => o.tz === prefs.timezone) || {
    tz: prefs.timezone,
    flag: '🌍',
    gmt: offsetForTz(prefs.timezone),
    city: cityFromTz(prefs.timezone),
  };

  if (isLoading) return <div className="p-4">Loading…</div>;
  if (isError) return <div className="p-4">Couldn’t load preferences.</div>;

  return (
    <div className="max-w-4xl mt-2 mx-auto p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Preferences</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={!isDirty || saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            <Check className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Timezone */}
      <Card>
        <div className="flex items-center justify-between px-6 gap-5">
          <div className="flex-1 pr-6">
            <CardHeader className="mb-3 p-0">
              <CardTitle>Timezone</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground">
                Used as the default timezone for new connected channels and
                notifications.
              </p>
            </CardContent>
          </div>

          <div className="flex-shrink-0 min-w-[200px]">
            <Label htmlFor="timezone" className="sr-only">
              Timezone
            </Label>
            <Select
              value={prefs.timezone}
              onValueChange={(v) => setPrefs((p) => ({ ...p, timezone: v }))}
            >
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue>
                  <span className="inline-flex items-center gap-2">
                    {selectedTz.flag ? (
                      <span className="text-lg">{selectedTz.flag}</span>
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    <span className="truncate">
                      {selectedTz.city}{' '}
                      <span className="text-muted-foreground">
                        ({selectedTz.gmt})
                      </span>
                    </span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {tzOptions.map((o) => (
                  <SelectItem key={o.tz} value={o.tz}>
                    <span className="inline-flex items-center gap-2">
                      <span className="text-lg leading-none">{o.flag}</span>
                      <span>{o.city}</span>
                      <span className="text-muted-foreground">({o.gmt})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Time Format */}
      <Card>
        <div className="flex items-center justify-between px-6 gap-5">
          <div className="flex-1 pr-6">
            <CardHeader className="mb-3 p-0">
              <CardTitle>Time Format</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground">
                Set the time format for the Calendar and Queue.
              </p>
            </CardContent>
          </div>

          <div className="flex-shrink-0 min-w-[200px]">
            <Label htmlFor="time-format" className="sr-only">
              Time Format
            </Label>
            <Select
              value={prefs.timeFormat}
              onValueChange={(v) => setPrefs((p) => ({ ...p, timeFormat: v }))}
            >
              <SelectTrigger id="time-format" className="w-full">
                <SelectValue placeholder="Choose format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Scheduling Frequency
      <Card>
        <div className="flex items-center justify-between px-6 gap-5">
          <div className="flex-1 pr-6">
            <CardHeader className="mb-3 p-0">
              <CardTitle>Scheduling Frequency</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground">
                Choose how new posts are scheduled by default.
              </p>
            </CardContent>
          </div>

          <div className="flex-shrink-0 min-w-[200px]">
            <Label htmlFor="sched-freq" className="sr-only">
              Scheduling
            </Label>
            <Select
              value={prefs.schedulingFrequency}
              onValueChange={(v) =>
                setPrefs((p) => ({ ...p, schedulingFrequency: v }))
              }
            >
              <SelectTrigger id="sched-freq" className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="optimal">Optimal</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card> */}

      {/* Default Posting Action */}
      <Card>
        <CardHeader>
          <CardTitle>Default Posting Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We’ll use this time when a composer action doesn’t specify a time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-post-time">Default Time</Label>
              <Input
                id="default-post-time"
                type="time"
                value={prefs.defaultPostTime}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, defaultPostTime: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Must be HH:mm (24h). Display respects your selected time format.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-md border p-3 text-sm">{previewTime}</div>
            </div>
          </div>

          <Separator />
        </CardContent>
      </Card>
    </div>
  );
}
