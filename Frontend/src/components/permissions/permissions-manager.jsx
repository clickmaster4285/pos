'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';

import {
  CheckCircle2, ClipboardList, Calendar, Package, FileText,
  UsersRound, Store, UserPlus, UserMinus, UserCog, BarChart3, Eye,
  Settings, Shield, Users
} from 'lucide-react';

import { useGetCompanyQuery } from '@/features/CompanyApi';
import { humanize } from './helpers';

// Auto-map icons (best effort)
const getIconForPermission = (key) => {
  const map = {
    approve: <CheckCircle2 className="h-4 w-4" />,
    assign: <ClipboardList className="h-4 w-4" />,
    appointment: <Calendar className="h-4 w-4" />,
    product: <Package className="h-4 w-4" />,
    plan: <FileText className="h-4 w-4" />,
    team: <UsersRound className="h-4 w-4" />,
    vendor: <Store className="h-4 w-4" />,
    staffCreate: <UserPlus className="h-4 w-4" />,
    staffDelete: <UserMinus className="h-4 w-4" />,
    staffUpdate: <UserCog className="h-4 w-4" />,
    report: <BarChart3 className="h-4 w-4" />,
    view: <Eye className="h-4 w-4" />,
  };
  const lower = key.toLowerCase();
  for (const [keyword, icon] of Object.entries(map)) {
    if (lower.includes(keyword)) return icon;
  }
  return <Shield className="h-4 w-4" />;
};

const getCategory = (key) => {
  const lower = key.toLowerCase();
  if (lower.includes('staff') || lower.includes('team')) return 'staff';
  if (lower.includes('view') || lower.includes('report') || lower.includes('summary')) return 'data';
  return 'operations';
};

export function PermissionsManager() {
  const { data: companyData, isLoading } = useGetCompanyQuery();
  const permissionsConfig = companyData?.permissions || {};

  // Only permissions that are TRUE in company settings
  const dynamicPermissions = useMemo(() => {
    return Object.keys(permissionsConfig)
      .filter(key => permissionsConfig[key] === true)
      .map(key => ({
        id: key,
        label: humanize(key),
        category: getCategory(key),
        icon: getIconForPermission(key),
      }));
  }, [permissionsConfig]);

  const categories = useMemo(() => {
    const cats = { operations: [], staff: [], data: [] };
    dynamicPermissions.forEach(p => {
      cats[p.category].push(p);
    });
    return cats;
  }, [dynamicPermissions]);

  const [roles, setRoles] = useState([
    {
      id: '1',
      name: 'Manager',
      description: 'Full access to operations and staff management',
      color: 'bg-emerald-500',
      permissions: Object.fromEntries(dynamicPermissions.map(p => [p.id, true])),
    },
    {
      id: '2',
      name: 'Staff',
      description: 'Basic access for daily operations',
      color: 'bg-blue-500',
      permissions: Object.fromEntries(dynamicPermissions.map(p => [p.id, false])),
    },
  ]);

  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || '');

  const currentRole = roles.find(r => r.id === selectedRole);

  const togglePermission = (permissionId) => {
    setRoles(roles.map(role => {
      if (role.id === selectedRole) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permissionId]: !role.permissions[permissionId]
          }
        };
      }
      return role;
    }));
  };

  const countActivePermissions = (perms) => {
    return Object.values(perms).filter(Boolean).length;
  };

  const handleSave = () => {
    toast.success('Roles updated locally', {
      description: 'In production, this would sync to backend.',
    });
  };

  const handleReset = () => {
    toast.info('Reset canceled');
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading permissions...</div>;
  }

  if (dynamicPermissions.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No permissions defined for this company.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Role-Based Permissions Manager
        </h1>
        <p className="text-muted-foreground mt-2">
          Define permission templates by role. Only company-enabled permissions are shown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map(role => (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all ${selectedRole === role.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`h-3 w-3 rounded-full ${role.color}`} />
                      <Badge variant="secondary">
                        {countActivePermissions(role.permissions)}/{dynamicPermissions.length}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    {currentRole?.name || 'Select a role'} Permissions
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Toggle permissions for this role
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>Reset</Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentRole && (
                <Tabs defaultValue="operations" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="operations">Operations</TabsTrigger>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="data">Data & Reports</TabsTrigger>
                  </TabsList>

                  {Object.entries(categories).map(([cat, perms]) => (
                    perms.length > 0 && (
                      <TabsContent key={cat} value={cat} className="space-y-4">
                        {perms.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1 text-primary">{permission.icon}</div>
                              <div className="flex-1">
                                <Label className="text-base font-medium cursor-pointer">
                                  {permission.label}
                                </Label>
                              </div>
                            </div>
                            <Switch
                              checked={currentRole.permissions[permission.id] || false}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                          </div>
                        ))}
                      </TabsContent>
                    )
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}