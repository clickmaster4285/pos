'use client';

import React, { useMemo, useState } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, EyeOff, ShieldCheck, Settings2 } from 'lucide-react';
import { useGetAllDevicesQuery } from '@/features/attendanceDeviceApi'; // Import the query hook

const StaffForm = ({
  staff,
  setStaff,
  isEditMode,
  onSubmit,
  isSubmitting,
  onCancel,
  subRoles = [],
  departments = [],
  permissionLabels = {},
  staffPermissionKeys = null,
  billingPermissionKeys = null,
  salaryPermissionKeys = null,
}) => {
  // Fetch devices
  const { data: devicesData, isLoading: isDevicesLoading } =
    useGetAllDevicesQuery();
  const devices = devicesData?.data || [];

  // Local lists (allow custom values)
  const [roleList, setRoleList] = useState(subRoles);
  const [deptList, setDeptList] = useState(departments);

  // UI state for custom role/department
  const [addingCustomRole, setAddingCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [addingCustomDept, setAddingCustomDept] = useState(false);
  const [customDeptText, setCustomDeptText] = useState('');

  // Password helpers
  const [showPassword, setShowPassword] = useState(false);

  // Permissions tabs
  const [activePermTab, setActivePermTab] = useState('staff'); // 'staff' | 'billing' | 'other' | 'salary'

  // ---------- Permission keys & grouping ----------
  const permissionKeys = useMemo(
    () => Object.keys(permissionLabels || {}),
    [permissionLabels]
  );

  // If provided, use staffPermissionKeys; else infer by key name containing "staff"
  const staffKeys = useMemo(() => {
    if (Array.isArray(staffPermissionKeys) && staffPermissionKeys.length > 0) {
      return staffPermissionKeys.filter((k) => permissionLabels[k] != null);
    }
    return permissionKeys.filter((k) => /staff/i.test(k));
  }, [permissionKeys, staffPermissionKeys, permissionLabels]);

  const billingKeys = useMemo(() => {
    if (
      Array.isArray(billingPermissionKeys) &&
      billingPermissionKeys.length > 0
    ) {
      return billingPermissionKeys.filter((k) => permissionLabels[k] != null);
    }
    // fallback inference if not passed
    return permissionKeys.filter((k) => /billing/i.test(k));
  }, [permissionKeys, billingPermissionKeys, permissionLabels]);

  // NEW: Salary group — prefer explicit keys from parent; otherwise infer by common salary/pay terms
  const salaryKeys = useMemo(() => {
    if (
      Array.isArray(salaryPermissionKeys) &&
      salaryPermissionKeys.length > 0
    ) {
      // Trust the explicit list from parent; keep the original order.
      return salaryPermissionKeys;
    }
    // Fallback only if parent forgot to pass a list
    return [
      'createPayment',
      'viewAllStaffSalaries',
      'updateSalary',
      'deletePayment',
      'staffSummary',
      'viewActiveLog',
      'viewCompanySummary',
    ];
  }, [salaryPermissionKeys]);

  const otherKeys = useMemo(() => {
    const exclude = new Set([...staffKeys, ...billingKeys, ...salaryKeys]);
    return permissionKeys.filter((k) => !exclude.has(k));
  }, [permissionKeys, staffKeys, billingKeys, salaryKeys]);

  // ---------- Selection state ----------
  const allSelected = useMemo(() => {
    if (!staff?.permissions) return false;
    return (
      permissionKeys.length > 0 &&
      permissionKeys.every((k) => !!staff.permissions[k])
    );
  }, [permissionKeys, staff?.permissions]);

  const allStaffSelected = useMemo(() => {
    if (!staff?.permissions || staffKeys.length === 0) return false;
    return staffKeys.every((k) => !!staff.permissions[k]);
  }, [staffKeys, staff?.permissions]);

  const allBillingSelected = useMemo(() => {
    if (!staff?.permissions || billingKeys.length === 0) return false;
    return billingKeys.every((k) => !!staff.permissions[k]);
  }, [billingKeys, staff?.permissions]);

  const allSalarySelected = useMemo(() => {
    if (!staff?.permissions || salaryKeys.length === 0) return false;
    return salaryKeys.every((k) => !!staff.permissions[k]);
  }, [salaryKeys, staff?.permissions]);

  const allOtherSelected = useMemo(() => {
    if (!staff?.permissions || otherKeys.length === 0) return false;
    return otherKeys.every((k) => !!staff.permissions[k]);
  }, [otherKeys, staff?.permissions]);

  // ---------- Focus helpers + Enter navigation ----------
  function focusById(id) {
    if (!id) return;
    const el = document.getElementById(id);
    el && el.focus && el.focus();
  }
  function onEnterFocus(e, nextId) {
    if (e.key === 'Enter') {
      e.preventDefault(); // never submit on Enter
      if (nextId) focusById(nextId);
    }
  }

  //-------------------------
  // safe read
  const perms = staff?.permissions ?? {};

  const setPerm = (key, value) =>
    setStaff((prev) => ({
      ...prev,
      permissions: { ...(prev.permissions ?? {}), [key]: value },
    }));

  const toggleAll = (keys, value) => {
    if (!Array.isArray(keys) || !keys.length) return;
    setStaff((prev) => ({
      ...prev,
      permissions: {
        ...(prev.permissions ?? {}),
        ...Object.fromEntries(keys.map((k) => [k, value])),
      },
    }));
  };

  //---------------------------
  // ---------- Permission handlers ----------
  function handlePermissionToggle(key, checked) {
    setStaff({
      ...staff,
      permissions: {
        ...(staff?.permissions || {}),
        [key]: !!checked,
      },
    });
  }

  function handleSelectAllPermissions() {
    const next = {};
    for (const k of permissionKeys) next[k] = true;
    setStaff({ ...staff, permissions: next });
  }

  function handleClearAllPermissions() {
    const next = {};
    for (const k of permissionKeys) next[k] = false;
    setStaff({ ...staff, permissions: next });
  }

  function handleSelectAllStaff() {
    const next = { ...(staff?.permissions || {}) };
    staffKeys.forEach((k) => (next[k] = true));
    setStaff({ ...staff, permissions: next });
  }

  function handleClearAllStaff() {
    const next = { ...(staff?.permissions || {}) };
    staffKeys.forEach((k) => (next[k] = false));
    setStaff({ ...staff, permissions: next });
  }

  function handleSelectAllBilling() {
    const next = { ...(staff?.permissions || {}) };
    billingKeys.forEach((k) => (next[k] = true));
    setStaff({ ...staff, permissions: next });
  }

  function handleClearAllBilling() {
    const next = { ...(staff?.permissions || {}) };
    billingKeys.forEach((k) => (next[k] = false));
    setStaff({ ...staff, permissions: next });
  }

  // NEW: salary bulk-selects
  function handleSelectAllSalary() {
    const next = { ...(staff?.permissions || {}) };
    salaryKeys.forEach((k) => (next[k] = true));
    setStaff({ ...staff, permissions: next });
  }
  function handleClearAllSalary() {
    const next = { ...(staff?.permissions || {}) };
    salaryKeys.forEach((k) => (next[k] = false));
    setStaff({ ...staff, permissions: next });
  }

  function handleSelectAllOther() {
    const next = { ...(staff?.permissions || {}) };
    otherKeys.forEach((k) => (next[k] = true));
    setStaff({ ...staff, permissions: next });
  }

  function handleClearAllOther() {
    const next = { ...(staff?.permissions || {}) };
    otherKeys.forEach((k) => (next[k] = false));
    setStaff({ ...staff, permissions: next });
  }

  // ---------- Custom role/department ----------
  function addCustomRole() {
    const text = customRoleText.trim();
    if (!text) return;
    const value = text.toLowerCase().replace(/\s+/g, '_');
    if (!roleList.some((r) => r.value === value)) {
      setRoleList((prev) => [...prev, { value, label: text }]);
    }
    setStaff({ ...staff, subRole: value });
    setCustomRoleText('');
    setAddingCustomRole(false);
    // move focus to dept select
    focusById('department-select-trigger');
  }

  function addCustomDept() {
    const text = customDeptText.trim();
    if (!text) return;
    const exists = deptList.some((d) => d.toLowerCase() === text.toLowerCase());
    if (!exists) setDeptList((prev) => [...prev, text]);
    setStaff({ ...staff, department: text });
    setCustomDeptText('');
    setAddingCustomDept(false);
  }

  function generatePassword(length = 10) {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%^&*?';
    let out = '';
    crypto.getRandomValues(new Uint32Array(length)).forEach((n) => {
      out += chars[n % chars.length];
    });
    setStaff({ ...staff, password: out });
  }

    // Handle device selection
  function handleDeviceToggle(deviceId, checked) {
    setStaff({
      ...staff,
      deviceIds: checked
        ? [...(staff?.deviceIds || []), deviceId]
        : (staff?.deviceIds || []).filter((id) => id !== deviceId),
    });
  }

  // Which keys to show for the active tab
  const visibleKeys = useMemo(() => {
    if (activePermTab === 'staff') return staffKeys;
    if (activePermTab === 'billing') return billingKeys;
    if (activePermTab === 'salary') return salaryKeys; // <-- wire salary tab
    return otherKeys;
  }, [activePermTab, staffKeys, billingKeys, salaryKeys, otherKeys]);

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader className="space-y-1.5">
        <DialogTitle className="text-xl">
          {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Update this staff member's details, role, and permissions."
            : 'Create a new staff member with role, department, and permissions.'}
        </DialogDescription>
      </DialogHeader>

      {/* Identity */}
      <div className="space-y-5">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 opacity-70" />
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor={`${isEditMode ? 'edit-' : ''}name`}>
                Full Name
              </Label>
              <Input
                id={`${isEditMode ? 'edit-' : ''}name`}
                value={staff?.name || ''}
                onChange={(e) => setStaff({ ...staff, name: e.target.value })}
                onKeyDown={(e) =>
                  onEnterFocus(e, `${isEditMode ? 'edit-' : ''}email`)
                }
                placeholder="e.g., Ayesha Khan"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor={`${isEditMode ? 'edit-' : ''}email`}>Email</Label>
              <Input
                id={`${isEditMode ? 'edit-' : ''}email`}
                type="email"
                value={staff?.email || ''}
                onChange={(e) => setStaff({ ...staff, email: e.target.value })}
                onKeyDown={(e) =>
                  onEnterFocus(e, `${isEditMode ? 'edit-' : ''}phone`)
                }
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor={`${isEditMode ? 'edit-' : ''}phone`}>Phone</Label>
              <Input
                id={`${isEditMode ? 'edit-' : ''}phone`}
                value={staff?.phone || ''}
                onChange={(e) => setStaff({ ...staff, phone: e.target.value })}
                onKeyDown={(e) =>
                  onEnterFocus(e, `${isEditMode ? 'edit-' : ''}password`)
                }
                placeholder="+92 3XX XXXXXXX"
              />
            </div>

            {/* Password with show/hide + generate */}
            <div className="space-y-2">
              <Label htmlFor={`${isEditMode ? 'edit-' : ''}password`}>
                Password
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`${isEditMode ? 'edit-' : ''}password`}
                  type={showPassword ? 'text' : 'password'}
                  value={staff?.password || ''}
                  onChange={(e) =>
                    setStaff({ ...staff, password: e.target.value })
                  }
                  onKeyDown={(e) =>
                    onEnterFocus(e, `${isEditMode ? 'edit-' : ''}address`)
                  }
                  placeholder={
                    isEditMode
                      ? 'Enter new password (optional)'
                      : 'Set a password'
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => generatePassword()}
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor={`${isEditMode ? 'edit-' : ''}address`}>
              Address
            </Label>
            <Input
              id={`${isEditMode ? 'edit-' : ''}address`}
              value={staff?.address || ''}
              onChange={(e) => setStaff({ ...staff, address: e.target.value })}
              onKeyDown={(e) =>
                onEnterFocus(e, `${isEditMode ? 'edit-' : ''}baseSalaryMonthly`)
              }
              placeholder="Street, City, Country"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salary */}
            <div className="space-y-2">
              <Label htmlFor={`${isEditMode ? 'edit-' : ''}baseSalaryMonthly`}>
                Salary
              </Label>
              <Input
                id={`${isEditMode ? 'edit-' : ''}baseSalaryMonthly`}
                value={staff?.baseSalaryMonthly || ''}
                onChange={(e) =>
                  setStaff({ ...staff, baseSalaryMonthly: e.target.value })
                }
                placeholder="Enter employee salary"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Role & Department */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 opacity-70" />
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Role & Department
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={staff?.subRole || ''}
                  onValueChange={(value) =>
                    setStaff({ ...staff, subRole: value })
                  }
                >
                  <SelectTrigger id="role-select-trigger">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleList.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddingCustomRole((s) => !s)}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Custom
                </Button>
              </div>

              {addingCustomRole && (
                <div className="mt-2 flex gap-2">
                  <Input
                    id="custom-role-input"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomRole();
                      }
                    }}
                    placeholder="e.g., Floor Supervisor"
                  />
                  <Button type="button" onClick={addCustomRole}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Department</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={staff?.department || ''}
                  onValueChange={(value) =>
                    setStaff({ ...staff, department: value })
                  }
                >
                  <SelectTrigger id="department-select-trigger">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {deptList.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddingCustomDept((s) => !s)}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Custom
                </Button>
              </div>

              {addingCustomDept && (
                <div className="mt-2 flex gap-2">
                  <Input
                    id="custom-dept-input"
                    value={customDeptText}
                    onChange={(e) => setCustomDeptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomDept();
                      }
                    }}
                    placeholder="e.g., Front Desk"
                  />
                  <Button type="button" onClick={addCustomDept}>
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>

          {(staff?.subRole || staff?.department) && (
            <div className="flex flex-wrap gap-2">
              {staff?.subRole && (
                <Badge variant="outline" className="text-xs">
                  Role:{' '}
                  {roleList.find((r) => r.value === staff.subRole)?.label ||
                    staff.subRole}
                </Badge>
              )}
              {staff?.department && (
                <Badge variant="outline" className="text-xs">
                  Dept: {staff.department}
                </Badge>
              )}
            </div>
          )}
        </section>

        {/* Devices */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Attendance Devices
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {devices.length} available
            </Badge>
          </div>

          {isDevicesLoading ? (
            <p className="text-sm text-muted-foreground">Loading devices...</p>
          ) : devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No devices available.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {devices.map((device) => (
                <label
                  key={device._id}
                  htmlFor={`device-${device._id}`}
                  className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`device-${device._id}`}
                    checked={staff?.deviceIds?.includes(device._id) || false}
                    onCheckedChange={(checked) =>
                      handleDeviceToggle(device._id, checked)
                    }
                  />
                  <span className="text-sm">
                    {device.deviceName || device._id}
                  </span>
                </label>
              ))}
            </div>
          )}

          {staff?.deviceIds?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {staff.deviceIds.map((deviceId) => (
                <Badge key={deviceId} variant="outline" className="text-xs">
                  Device:{' '}
                  {devices.find((d) => d._id === deviceId)?.deviceName ||
                    deviceId}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* Permissions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Permissions
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {permissionKeys.length} available
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllPermissions}
                disabled={permissionKeys.length === 0}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAllPermissions}
                disabled={permissionKeys.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Tabs + per-tab actions */}
          <div className="space-y-3">
            {/* Tabs: 3 per row, wrap to next line inside the dialog */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={activePermTab === 'staff' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs whitespace-normal text-center leading-tight"
                onClick={() => setActivePermTab('staff')}
              >
                Staff Permissions
              </Button>

              <Button
                type="button"
                variant={activePermTab === 'billing' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs whitespace-normal text-center leading-tight"
                onClick={() => setActivePermTab('billing')}
              >
                Billing Permissions
              </Button>

              <Button
                type="button"
                variant={activePermTab === 'other' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs whitespace-normal text-center leading-tight"
                onClick={() => setActivePermTab('other')}
              >
                Other Permissions
              </Button>

              <Button
                type="button"
                variant={activePermTab === 'salary' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs whitespace-normal text-center leading-tight"
                onClick={() => setActivePermTab('salary')}
              >
                Manage Salary Permissions
              </Button>
            </div>

            {/* Quick actions below tabs so nothing overflows horizontally */}
            {activePermTab === 'staff' && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllStaff}
                  disabled={staffKeys.length === 0}
                >
                  Select All Staff
                </Button>
              </div>
            )}

            {activePermTab === 'billing' && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllBilling}
                  disabled={billingKeys.length === 0}
                >
                  Select All Billing
                </Button>
              </div>
            )}

            {activePermTab === 'other' && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllOther}
                  disabled={otherKeys.length === 0}
                >
                  Select All Other
                </Button>
              </div>
            )}

            {activePermTab === 'salary' && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllSalary}
                  disabled={salaryKeys.length === 0}
                >
                  Select All Salary
                </Button>
                {/* If you want a Clear button too, uncomment:
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllSalary}
                  disabled={salaryKeys.length === 0}
                >
                  Clear All Salary
                </Button> */}
              </div>
            )}
          </div>

          {/* Permission list for the active tab */}
          {visibleKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No permissions in this group.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleKeys.map((key) => (
                <label
                  key={key}
                  htmlFor={`${isEditMode ? 'edit-' : ''}${key}`}
                  className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`${isEditMode ? 'edit-' : ''}${key}`}
                    checked={!!staff?.permissions?.[key]}
                    onCheckedChange={(checked) =>
                      handlePermissionToggle(key, checked)
                    }
                  />
                  <span className="text-sm">
                    {permissionLabels[key] ?? key}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {allSelected
              ? 'All permissions are selected.'
              : 'Choose only the modules this staff member should access.'}
          </div>
        </section>
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Adding...'
            : isEditMode
            ? 'Update Staff Member'
            : 'Add Staff Member'}
        </Button>
      </div>
    </DialogContent>
  );
};

export default StaffForm;
