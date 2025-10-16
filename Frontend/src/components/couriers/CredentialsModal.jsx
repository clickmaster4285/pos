'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY_FORM = {
  baseUrl: '',
  clientId: '',
  clientSecret: '',
  apiKey: '',
  username: '',
  password: '',
  scope: '',
  environment: 'Sandbox',
};

export function CredentialsModal({ open, onOpenChange, courier, onSave }) {
  const [form, setForm] = React.useState(EMPTY_FORM);

  const [show, setShow] = React.useState({
    clientSecret: false,
    apiKey: false,
    password: false,
  });

  // determine if courier already has any credentials saved
  const hasCredentials = React.useMemo(() => {
    const c = courier?.credentials;
    if (!c) return false;
    // consider "has creds" if any field (except environment) is non-empty
    const { environment, ...rest } = c;
    return Object.values(rest).some((v) =>
      typeof v === 'string' ? v.trim().length > 0 : Boolean(v)
    );
  }, [courier]);

  // prefill/reset on courier change or on open
  React.useEffect(() => {
    if (!courier) return;

    if (courier?.credentials) {
      setForm((prev) => ({
        ...prev,
        ...EMPTY_FORM,
        ...courier.credentials,
        environment:
          courier.credentials.environment || courier.environment || 'Sandbox',
      }));
    } else {
      setForm((prev) => ({
        ...EMPTY_FORM,
        environment: courier.environment || 'Sandbox',
      }));
    }
  }, [courier, open]);

  if (!courier) return null;

  const handleSave = () => {
    const id = courier._id || courier.id;
    if (!id) {
      alert('Courier id is missing');
      return;
    }

    // require at least one actual credential field to be filled when creating
    const {
      baseUrl,
      clientId,
      clientSecret,
      apiKey,
      username,
      password,
      scope,
    } = form;
    const hasAnyInput = [
      baseUrl,
      clientId,
      clientSecret,
      apiKey,
      username,
      password,
      scope,
    ].some((v) => (typeof v === 'string' ? v.trim() : v));

    if (!hasCredentials && !hasAnyInput) {
      alert('Please enter at least one credential field.');
      return;
    }

    onSave?.({
      id,
      ...form,
      mode: hasCredentials ? 'update' : 'create', // optional hint for your handler
    });
    onOpenChange(false);
  };

  const title = `${hasCredentials ? 'Edit' : 'Add'} Credentials — ${
    courier.name
  }`;
  const primaryLabel = hasCredentials ? 'Save Changes' : 'Add Credentials';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!hasCredentials ? (
          <div className="text-sm rounded-md border border-dashed  p-3 bg-muted/40 ">
            After adding credentials, you need to <b>Test Connection</b> to
            change the status to <b>Connected</b>.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 mt-2">
          {/* Base URL */}
          <div className="grid gap-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              placeholder="https://api.example.com"
            />
          </div>

          {/* Client ID & Secret */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                placeholder="your-client-id"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="clientSecret"
                  type={show.clientSecret ? 'text' : 'password'}
                  value={form.clientSecret}
                  onChange={(e) =>
                    setForm({ ...form, clientSecret: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* API Key & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={show.apiKey ? 'text' : 'password'}
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scope">Scope</Label>
              <Input
                id="scope"
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                placeholder="shipments.read shipments.write"
              />
            </div>
          </div>

          {/* Username & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="api-user"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={show.password ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Environment */}
          <div className="grid gap-2">
            <Label>Environment</Label>
            <Select
              value={form.environment}
              onValueChange={(v) => setForm((f) => ({ ...f, environment: v }))}
            >
              <SelectTrigger aria-label="Environment">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sandbox">Sandbox</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm((prev) => ({
                  ...EMPTY_FORM,
                  environment: courier?.environment || 'Sandbox',
                }))
              }
            >
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{primaryLabel}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
