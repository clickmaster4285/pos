'use client';

import React, { useState } from 'react';

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
  Users,
  CheckCircle2,
  ClipboardList,
  Calendar,
  Package,
  FileText,
  UsersRound,
  Store,
  UserPlus,
  UserMinus,
  UserCog,
  BarChart3,
  Eye,
} from 'lucide-react';

const permissionsList = [
  {
    id: 'approveRequests',
    label: 'Approve Requests',
    description: 'Approve service and maintenance requests',
    icon: <CheckCircle2 className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'assignTasks',
    label: 'Assign Tasks',
    description: 'Assign tasks to team members',
    icon: <ClipboardList className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'manageAppointments',
    label: 'Manage Appointments',
    description: 'Create, edit, and cancel appointments',
    icon: <Calendar className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'manageProduct',
    label: 'Manage Product',
    description: 'Control parts and supplies product',
    icon: <Package className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'managePlans',
    label: 'Manage Plans',
    description: 'Create and modify service plans',
    icon: <FileText className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'manageTeams',
    label: 'Manage Teams',
    description: 'Organize and manage team structure',
    icon: <UsersRound className="h-4 w-4" />,
    category: 'staff',
  },
  {
    id: 'createVendors',
    label: 'Create Vendors',
    description: 'Add and manage vendor relationships',
    icon: <Store className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'updateVendors',
    label: 'Update Vendors',
    description: 'Add and manage vendor relationships',
    icon: <Store className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'deleteVendors',
    label: 'Delete Vendors',
    description: 'Add and manage vendor relationships',
    icon: <Store className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'viewVendors',
    label: 'View Vendors',
    description: 'Add and manage vendor relationships',
    icon: <Store className="h-4 w-4" />,
    category: 'operations',
  },
  {
    id: 'staffCreate',
    label: 'Create Staff',
    description: 'Add new staff members to the system',
    icon: <UserPlus className="h-4 w-4" />,
    category: 'staff',
  },
  {
    id: 'staffDelete',
    label: 'Delete Staff',
    description: 'Remove staff members from the system',
    icon: <UserMinus className="h-4 w-4" />,
    category: 'staff',
  },
  {
    id: 'staffUpdate',
    label: 'Update Staff',
    description: 'Edit staff member information',
    icon: <UserCog className="h-4 w-4" />,
    category: 'staff',
  },
  {
    id: 'viewReports',
    label: 'View Reports',
    description: 'Access analytics and reports',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'data',
  },
  {
    id: 'viewallstaff',
    label: 'View All Staff',
    description: 'View complete staff directory',
    icon: <Eye className="h-4 w-4" />,
    category: 'data',
  },
];

const initialRoles = [
  {
    id: '1',
    name: 'Manager',
    description: 'Oversees daily operations and manages staff performance',
    color: 'bg-emerald-500',
    permissions: {
      approveRequests: true,
      assignTasks: true,
      manageAppointments: true,
      manageProduct: true,
      managePlans: true,
      manageTeams: true,
      createVendors: false,
      updateVendors: false,
      deleteVendors: false,
      viewVendors: false,
      staffCreate: false,
      staffDelete: false,
      staffUpdate: true,
      viewReports: true,
      viewallstaff: true,
    },
  },
  {
    id: '2',
    name: 'Seller',
    description:
      'Handles product listings, pricing, and customer sales operations.',
    color: 'bg-blue-500',
    permissions: {
      approveRequests: false,
      assignTasks: false,
      manageAppointments: true,
      manageProduct: false,
      managePlans: false,
      manageTeams: false,
      viewVendors: false,
      staffCreate: false,
      staffDelete: false,
      staffUpdate: false,
      viewReports: false,
      viewallstaff: false,
    },
  },
  {
    id: '3',
    name: 'Receptionist',
    description: 'Handles front-desk operations and appointments',
    color: 'bg-amber-500',
    permissions: {
      approveRequests: true,
      assignTasks: true,
      manageAppointments: true,
      manageProduct: true,
      managePlans: false,
      manageTeams: false,
      viewVendors: false,
      staffCreate: false,
      staffDelete: false,
      staffUpdate: false,
      viewReports: true,
      viewallstaff: true,
    },
  },
  {
    id: '4',
    name: 'Mechanic',
    description: 'Responsible for repairing and maintaining vehicles',
    color: 'bg-red-500',
    permissions: {
      approveRequests: true,
      assignTasks: true,
      manageAppointments: true,
      manageProduct: true,
      managePlans: true,
      manageTeams: true,
      viewVendors: false,
      staffCreate: true,
      staffDelete: true,
      staffUpdate: true,
      viewReports: true,
      viewallstaff: true,
    },
  },
];

export function PermissionsManager() {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRole, setSelectedRole] = useState(roles[0].id);

  const currentRole = roles.find((r) => r.id === selectedRole);

  const togglePermission = (permissionId) => {
    setRoles(
      roles.map((role) => {
        if (role.id === selectedRole) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [permissionId]: !role.permissions[permissionId],
            },
          };
        }
        return role;
      })
    );
  };

  const handleSave = () => {
    toast({
      title: 'Permissions Updated',
      description: `Successfully updated permissions for ${currentRole?.name}`,
    });
  };

  const handleReset = () => {
    setRoles(initialRoles);
    toast({
      title: 'Permissions Reset',
      description: 'All permissions have been reset to default values',
    });
  };

  const getPermissionsByCategory = (category) => {
    return permissionsList.filter((p) => p.category === category);
  };

  const countActivePermissions = (role) => {
    return Object.values(role.permissions).filter(Boolean).length;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Toaster />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
          Permissions Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Configure role-based access control for your automotive service
          platform
        </p>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {roles.map((role) => (
          <Card
            key={role.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === role.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole(role.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-3 w-3 rounded-full ${role.color}`} />
                <Badge variant="secondary">
                  {countActivePermissions(role)}/{permissionsList.length}
                </Badge>
              </div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <CardDescription className="text-sm">
                {role.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Permissions Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                {currentRole?.name} Permissions
              </CardTitle>
              <CardDescription className="mt-2">
                Configure what {currentRole?.name?.toLowerCase()}s can access
                and manage
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="operations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="staff">Management</TabsTrigger>
              <TabsTrigger value="data">Data & Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="space-y-4">
              {getPermissionsByCategory('operations').map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-primary">{permission.icon}</div>
                    <div className="flex-1">
                      <Label
                        htmlFor={permission.id}
                        className="text-base font-medium cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={permission.id}
                    checked={currentRole?.permissions[permission.id] || false}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              {getPermissionsByCategory('staff').map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-primary">{permission.icon}</div>
                    <div className="flex-1">
                      <Label
                        htmlFor={permission.id}
                        className="text-base font-medium cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={permission.id}
                    checked={currentRole?.permissions[permission.id] || false}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              {getPermissionsByCategory('data').map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-primary">{permission.icon}</div>
                    <div className="flex-1">
                      <Label
                        htmlFor={permission.id}
                        className="text-base font-medium cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={permission.id}
                    checked={currentRole?.permissions[permission.id] || false}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
