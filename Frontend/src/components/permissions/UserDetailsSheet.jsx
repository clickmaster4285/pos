'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Settings,
  CheckCircle2,
  XCircle,
  User,
  Shield,
  History,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Key,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { getUserId, isUserActive } from './helpers';

const BoolBadge = ({ on }) =>
  on ? (
    <Badge className="bg-green-500/20 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Yes
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <XCircle className="h-3 w-3 mr-1" />
      No
    </Badge>
  );

const Field = ({ label, value, icon: Icon }) => (
  <div className="flex items-start justify-between py-3 px-1 border-b last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </div>
    <div className="text-sm font-medium text-right max-w-[60%] break-words">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

const ProfileSection = ({ user }) => {
  const userId = getUserId(user);

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Field label="User ID" value={userId} icon={Key} />
          <Field label="Email" value={user?.email} icon={Mail} />
          <Field label="Company ID" value={user?.companyId} icon={Building} />
          <Field label="Department" value={user?.department} icon={Building} />
          <Field label="Phone" value={user?.phone} icon={Phone} />
          <Field label="Address" value={user?.address} icon={MapPin} />
          <div className="flex items-center justify-between py-3 px-1 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              MFA Enabled
            </div>
            <BoolBadge on={!!user?.twoFactorAuth?.isEnabled} />
          </div>
          <Field
            label="Login Attempts"
            value={user?.loginAttempts}
            icon={Key}
          />
          <Field
            label="Account Created"
            value={new Date(user?.createdAt || Date.now()).toLocaleString()}
            icon={Calendar}
          />
          <Field
            label="Last Updated"
            value={new Date(user?.updatedAt || Date.now()).toLocaleString()}
            icon={Calendar}
          />
        </CardContent>
      </Card>
    </div>
  );
};

const PermissionsSection = ({ user, permissionLabels, onManage }) => {
  const perms = user?.permissions || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            User Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{label}</span>
                <BoolBadge on={!!perms[key]} />
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => onManage(user)}
            className="w-full gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Permissions
          </Button>
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(perms).filter(Boolean).length}
              </div>
              <div className="text-muted-foreground">Active Permissions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-muted-foreground">
                {Object.values(perms).filter((perm) => !perm).length}
              </div>
              <div className="text-muted-foreground">Inactive Permissions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const HistorySection = ({ user }) => {
  const history = user?.history || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Activity History</p>
              <p className="text-sm">
                User activity will appear here once recorded
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {history
                .slice()
                .reverse()
                .map((h, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-start p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {h?.action || 'Unknown Action'}
                        </div>
                        {h?.performedBy && (
                          <Badge variant="outline" className="text-xs">
                            by {h.performedBy}
                          </Badge>
                        )}
                      </div>
                      {h?.details && (
                        <div className="text-sm text-muted-foreground">
                          {h.details}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(
                          h?.createdAt || user?.updatedAt || Date.now()
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function UserDetailsSheet({
  user,
  open,
  onOpenChange,
  permissionLabels,
  onManage,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const active = isUserActive(user);
  if (!user) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection user={user} />;
      case 'permissions':
        return (
          <PermissionsSection
            user={user}
            permissionLabels={permissionLabels}
            onManage={onManage}
          />
        );
      case 'history':
        return <HistorySection user={user} />;
      default:
        return <ProfileSection user={user} />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-5"
      >
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6" />
                {user?.name || 'Unnamed User'}
              </SheetTitle>
              <SheetDescription className="text-base mt-2">
                {user?.email || 'No email provided'}
              </SheetDescription>
            </div>

            <Button onClick={() => onManage(user)} className="mt-3 gap-2">
              <Settings className="h-4 w-4" />
              Manage Permissions
            </Button>
          </div>
          {/* Status & Role Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2 rounded-lg">
            {active ? (
              <Badge className="bg-green-500/20 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 px-3 py-1">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="px-3 py-1">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
            <Badge variant="outline" className="px-3 py-1">
              {user?.subRole || user?.role || 'No role'}
            </Badge>
            {user?.verified && (
              <Badge className="bg-blue-500/20 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 px-3 py-1">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        <div className="mt-6 pb-6">{renderContent()}</div>
      </SheetContent>
    </Sheet>
  );
}
