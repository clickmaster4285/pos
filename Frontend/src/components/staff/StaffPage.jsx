'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import {
  useGetAllStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from '@/features/staffApi';
import StaffHeader from './StaffHeader';
import StaffFilter from './StaffFilter';
import StaffForm from './StaffForm';
import StaffCard from './StaffCard';
import StaffTable from './StaffTable';
import StaffDetailsSheet from './StaffDetailsSheet';

import { useContext } from 'react';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { useGetCompanyQuery } from '@/features/CompanyApi';

const StaffPage = () => {
  const { data: staff = [], isLoading, error } = useGetAllStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const { data: companyRes, isLoading: ComLoading } = useGetCompanyQuery();

  const { user } = useContext(AuthContext) || {};
  const authUser = useSelector((state) => state.auth.user);
  const industry = authUser?.industryName;

  const updatePermission = user?.permissions?.staffUpdate;
  const deletePermission = user?.permissions?.staffDelete;

  // ============ DYNAMIC PERMISSIONS ============
  const availablePermissionKeys = useMemo(() => {
    if (!companyRes?.permissions || typeof companyRes.permissions !== 'object') {
      return [];
    }
    return Object.keys(companyRes.permissions)
      .filter(key => companyRes.permissions[key] === true) // Only show permissions owner actually has
      .sort();
  }, [companyRes?.permissions]);

  // Auto generate nice labels
  const permissionLabels = useMemo(() => {
    const labels = {};
    availablePermissionKeys.forEach(key => {
      let label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();

      // Special fixes for common ones
      if (key === 'viewallstaff') label = 'View All Staff';
      if (key === 'staffCreate') label = 'Create Staff';
      if (key === 'staffUpdate') label = 'Update Staff';
      if (key === 'staffDelete') label = 'Delete Staff';
      if (key === 'companyprofileupdate') label = 'Update Company Profile';
      if (key === 'viewAllStaffSalaries') label = 'View All Staff Salaries';

      labels[key] = label;
    });
    return labels;
  }, [availablePermissionKeys]);

  // Group permissions logically for better UI
  const permissionGroups = useMemo(() => {
    const groups = {
      staff: { label: 'Staff Management', keys: [] },
      vendors: { label: 'Vendors', keys: [] },
      products: { label: 'Products', keys: [] },
      orders: { label: 'Orders', keys: [] },
      billing: { label: 'Billing', keys: [] },
      salary: { label: 'Salary & Payments', keys: [] },
      company: { label: 'Company Settings', keys: [] },
      other: { label: 'Other Permissions', keys: [] },
    };

    availablePermissionKeys.forEach(key => {
      if (key.toLowerCase().includes('staff')) {
        groups.staff.keys.push(key);
      } else if (key.toLowerCase().includes('vendor')) {
        groups.vendors.keys.push(key);
      } else if (key.toLowerCase().includes('product') || key.toLowerCase().includes('ingredient') || key.toLowerCase().includes('category')) {
        groups.products.keys.push(key);
      } else if (key.toLowerCase().includes('order') || key.toLowerCase().includes('table') || key.toLowerCase().includes('appointment')) {
        groups.orders.keys.push(key);
      } else if (key.toLowerCase().includes('billing') || key.toLowerCase().includes('payment')) {
        groups.billing.keys.push(key);
      } else if (key.toLowerCase().includes('salary') || key.toLowerCase().includes('summary') || key.toLowerCase().includes('active') || key.toLowerCase().includes('log')) {
        groups.salary.keys.push(key);
      } else if (key.toLowerCase().includes('company') || key.toLowerCase().includes('plan') || key.toLowerCase().includes('team')) {
        groups.company.keys.push(key);
      } else {
        groups.other.keys.push(key);
      }
    });

    return groups;
  }, [availablePermissionKeys]);

  // ============ STATE ============
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    subRole: '',
    department: '',
    phone: '',
    address: '',
    permissions: {},
  });

  const [editStaff, setEditStaff] = useState(null);

  // Initialize newStaff permissions when availablePermissionKeys load
  useEffect(() => {
    if (availablePermissionKeys.length > 0) {
      const defaultPerms = {};
      availablePermissionKeys.forEach(key => {
        defaultPerms[key] = false;
      });
      setNewStaff(prev => ({ ...prev, permissions: defaultPerms }));
    }
  }, [availablePermissionKeys]);

  // ============ SUB ROLES & DEPARTMENTS ============
  const allSubRoles = [
    { value: 'manager', label: 'Manager', color: 'bg-chart-1' },
    { value: 'receptionist', label: 'Receptionist', color: 'bg-chart-2' },
    { value: 'mechanic', label: 'Mechanic', color: 'bg-chart-5' },
    { value: 'seller', label: 'Seller', color: 'bg-chart-4' },
    { value: 'waiter', label: 'Waiter', color: 'bg-chart-2' },
    { value: 'chef', label: 'Chef', color: 'bg-chart-1' },
  ];

  const subRoles = industry?.toLowerCase() === 'restaurant'
    ? allSubRoles
    : allSubRoles.filter(r => !['waiter', 'chef'].includes(r.value));

  const departments = ['Engineering', 'Front Office', 'Service', 'Sales', 'Admin', 'Kitchen'];

  // ============ FILTERED STAFF LIST ============
  const staffList = useMemo(() => {
    if (Array.isArray(staff)) return staff;
    if (Array.isArray(staff?.data)) return staff.data;
    if (Array.isArray(staff?.results)) return staff.results;
    return [];
  }, [staff]);

  const departmentsList = useMemo(() => {
    return Array.from(new Set(staffList.map(s => (s?.department || '').trim()).filter(Boolean))).sort();
  }, [staffList]);

  const rolesList = useMemo(() => {
    return Array.from(new Set(staffList.map(s => (s?.subRole || s?.role || '').trim()).filter(Boolean))).sort();
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return staffList.filter(s => {
      const matchesSearch = !q || [
        s.name, s.email, s.subRole, s.role, s.department
      ].some(field => field?.toLowerCase().includes(q));

      const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;
      const matchesRole = roleFilter === 'all' || s.subRole === roleFilter || s.role === roleFilter;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [staffList, searchTerm, departmentFilter, roleFilter]);

  // ============ PAGINATION ============
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, filteredStaff.length]);

  const total = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  const pageNumbers = useMemo(() => {
    const max = 5;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = start + max - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - max + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // ============ HANDLERS ============
  const openQuickView = (member) => {
    setSelectedStaff(member);
    setIsSheetOpen(true);
  };

  const handleAddStaff = async () => {
    try {
      await createStaff(newStaff).unwrap();
      setIsAddDialogOpen(false);
      setNewStaff(prev => ({
        ...prev,
        name: '', email: '', password: '', phone: '', address: '',
        permissions: Object.fromEntries(availablePermissionKeys.map(k => [k, false]))
      }));
    } catch (err) {
      console.warn('Failed to create staff', err);
    }
  };

  const handleEditClick = (member) => {
    const fullPermissions = {};
    availablePermissionKeys.forEach(key => {
      fullPermissions[key] = member.permissions?.[key] || false;
    });

    setEditStaff({
      _id: member._id,
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      subRole: member.subRole,
      department: member.department,
      phone: member.phone,
      address: member.address,
      permissions: fullPermissions,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editStaff?._id) return;
    try {
      await updateStaff({ _id: editStaff._id, ...editStaff }).unwrap();
      setEditStaff(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.warn('Failed to update staff', err);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id).unwrap();
      } catch (err) {
        console.warn('Failed to delete staff', err);
      }
    }
  };

  const getRoleColor = (subRole) => {
    return subRoles.find(r => r.value === subRole)?.color || 'bg-primary';
  };

  const getInitials = (name) => (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ============ RENDER ============
  if (isLoading || ComLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (filteredStaff.length === 0 && !searchTerm) {
    return (
      <Card className="shadow-lg backdrop-blur-sm bg-card/80 border border-border/50">
        <StaffHeader
          isAddDialogOpen={isAddDialogOpen}
          setIsAddDialogOpen={setIsAddDialogOpen}
          newStaff={newStaff}
          setNewStaff={setNewStaff}
          handleAddStaff={handleAddStaff}
          isCreating={isCreating}
          subRoles={subRoles}
          departments={departments}
          permissionGroups={permissionGroups}
          permissionLabels={permissionLabels}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">No staff members found</h3>
          <p className="text-muted-foreground mt-2">Get started by creating a new staff member.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <StaffHeader
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        newStaff={newStaff}
        setNewStaff={setNewStaff}
        handleAddStaff={handleAddStaff}
        isCreating={isCreating}
        subRoles={subRoles}
        departments={departments}
        permissionGroups={permissionGroups}
        permissionLabels={permissionLabels}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <StaffForm
          staff={editStaff}
          setStaff={setEditStaff}
          isEditMode={true}
          onSubmit={handleUpdateStaff}
          isSubmitting={isUpdating}
          onCancel={() => setIsEditDialogOpen(false)}
          subRoles={subRoles}
          departments={departments}
          permissionGroups={permissionGroups}
          permissionLabels={permissionLabels}
        />
      </Dialog>

      <StaffFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        departments={departmentsList}
        roles={rolesList}
      />

      {/* Staff Grid / Table */}
      {viewMode === 'card' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedStaff.map(member => (
            <div key={member._id}>
              <StaffCard
                member={member}
                handleEditClick={handleEditClick}
                handleDeleteStaff={handleDeleteStaff}
                getRoleColor={getRoleColor}
                getInitials={getInitials}
                permissionLabels={permissionLabels}
                updatePermission={updatePermission}
                deletePermission={deletePermission}
                onRowClick={openQuickView}
              />
            </div>
          ))}
        </div>
      ) : (
        <StaffTable
          staff={paginatedStaff}
          handleEditClick={handleEditClick}
          handleDeleteStaff={handleDeleteStaff}
          getRoleColor={getRoleColor}
          getInitials={getInitials}
          permissionLabels={permissionLabels}
          updatePermission={updatePermission}
          deletePermission={deletePermission}
          onRowClick={openQuickView}
        />
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startIndex + 1}</span>–
          <span className="font-medium text-foreground">{endIndex}</span> of{' '}
          <span className="font-medium text-foreground">{total}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1}>« First</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</Button>
            {pageNumbers.map(p => (
              <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>Last »</Button>
          </div>
        </div>

        <StaffDetailsSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          staff={selectedStaff}
          onEdit={handleEditClick}
        />
      </div>
    </div>
  );
};

export default StaffPage;