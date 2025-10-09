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
// If you use shadcn's Select in this file:
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const Staff = () => {
  const { data: staff = [], isLoading, error } = useGetAllStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

  const { user } = useContext(AuthContext) || {};

  const updatePermission = user?.permissions?.staffUpdate;
  const deletePermission = user?.permissions?.staffDelete;

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    subRole: '',
    department: '',
    phone: '',
    address: '',
    permissions: {
      staffCreate: false,
      staffUpdate: false,
      staffDelete: false,
      viewallstaff: false,
      viewReports: false,
      //
      manageInventory: false,
      manageVendors: false,
      assignTasks: false,
      approveRequests: false,
      manageAppointments: false,
      manageTeams: false,
      managePlans: false,
      //
      createPayment: false,
      viewAllStaffSalaries: false,
      updateSalary: false,
      deletePayment: false,
      staffSummary: false,
      viewActiveLog: false,
      viewCompanySummary: false,
    },
  });
  const [editStaff, setEditStaff] = useState(null);

  // ---------- Pagination state ----------
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // options below

  // Reset to page 1 when search, pageSize, or data changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, staff.length]);

const subRoles = [
  { value: 'manager', label: 'Manager', color: 'bg-chart-1' },
  { value: 'receptionist', label: 'Receptionist', color: 'bg-chart-2' },
  { value: 'mechanic', label: 'Mechanic', color: 'bg-chart-5' },
  { value: 'seller', label: 'Seller', color: 'bg-chart-6' },
];
  const departments = [
    'Engineering',
    'Front Office',
    'Service',
    'Sales',
    'Admin',
  ];

  const permissionLabels = {
    staffCreate: 'Create Staff',
    staffUpdate: 'Update Staff',
    staffDelete: 'Delete Staff',
    viewallstaff: 'View All Staff',
    viewReports: 'View Reports',
    manageInventory: 'Manage Inventory',
    manageVendors: 'Manage Vendors',
    assignTasks: 'Assign Tasks',
    approveRequests: 'Approve Requests',
    manageAppointments: 'Manage Appointments',
    manageTeams: 'Manage Teams',
    managePlans: 'Manage Plans',
    addBilling: 'Add Billing',
    editBilling: 'Edit Billing',
    deleteBilling: 'Delete Billing',
    viewBilling: 'View Billing',
    //
    createPayment: 'Create Payment',
    viewAllStaffSalaries: 'View All Staff Salaries',
    updateSalary: 'Update Salary',
    deletePayment: 'Delete Payment',
    staffSummary: 'Staff Summary',
    viewActiveLog: 'View Active Log',
    viewCompanySummary: 'View Company Summary',
  };

  const staffPermissionKeys = [
    'staffCreate',
    'staffUpdate',
    'staffDelete',
    'viewallstaff',
  ];
  const billingPermissionKeys = [
    'addBilling',
    'editBilling',
    'deleteBilling',
    'viewBilling',
  ];
  const salaryPermissionKeys = [
    'createPayment',
    'viewAllStaffSalaries',
    'updateSalary',
    'deletePayment',
    'staffSummary',
    'viewActiveLog',
    'viewCompanySummary',
  ];
  // ---------- Filter state ----------

  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');

  const staffList = React.useMemo(() => {
    if (Array.isArray(staff)) return staff;
    if (Array.isArray(staff?.data)) return staff.data;
    if (Array.isArray(staff?.results)) return staff.results;
    return [];
  }, [staff]);

  const departmentsList = React.useMemo(() => {
    return Array.from(
      new Set(
        staffList.map((m) => (m?.department || '').trim()).filter(Boolean)
      )
    ).sort();
  }, [staffList]);

  const rolesList = React.useMemo(() => {
    return Array.from(
      new Set(
        staffList
          .map((m) => (m?.subRole || m?.role || '').trim())
          .filter(Boolean)
      )
    ).sort();
  }, [staffList]);

  const filteredStaff = React.useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    const dep = (departmentFilter || 'all').toLowerCase();
    const role = (roleFilter || 'all').toLowerCase();

    return staffList.filter((m) => {
      const name = (m?.name || '').toLowerCase();
      const email = (m?.email || '').toLowerCase();
      const subRole = (m?.subRole || '').toLowerCase();
      const roleVal = (m?.role || '').toLowerCase();
      const dept = (m?.department || '').toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        subRole.includes(q) ||
        roleVal.includes(q) ||
        dept.includes(q);

      const matchesDept = dep === 'all' || dept === dep;
      const matchesRole =
        role === 'all' || subRole === role || roleVal === role;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [staffList, searchTerm, departmentFilter, roleFilter]);

  //-------------------detail model form---------------
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const openQuickView = (member) => {
    setSelectedStaff(member);
    setIsSheetOpen(true);
  };

  // ---------- Pagination derived values ----------
  const total = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  // page number range (max 5 buttons)
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const handleAddStaff = async () => {
    try {
      await createStaff(newStaff).unwrap();
      setNewStaff({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        subRole: '',
        department: '',
        phone: '',
        address: '',
        permissions: {
          staffCreate: false,
          staffUpdate: false,
          staffDelete: false,
          viewallstaff: false,
          viewReports: false,
          manageInventory: false,
          manageVendors: false,
          assignTasks: false,
          approveRequests: false,
          manageAppointments: false,
          manageTeams: false,
          managePlans: false,
          //
          createPayment: false,
          viewAllStaffSalaries: false,
          updateSalary: false,
          deletePayment: false,
          staffSummary: false,
          viewActiveLog: false,
          viewCompanySummary: false,
        },
      });
      setIsAddDialogOpen(false);
    } catch {
      console.warn('Failed to create staff member.');
    }
  };

  const handleUpdateStaff = async () => {
    if (!editStaff?._id) return;
    try {
      await updateStaff({ _id: editStaff._id, ...editStaff }).unwrap();
      setEditStaff(null);
      setIsEditDialogOpen(false);
    } catch {
      console.warn('Failed to update staff member.');
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await deleteStaff(id).unwrap();
    } catch {
      console.warn('Failed to delete staff member.');
    }
  };

  const handleEditClick = (member) => {
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
      permissions: member.permissions,
    });
    setIsEditDialogOpen(true);
  };

  const getRoleColor = (subRole) => {
    const roleConfig = subRoles.find((role) => role.value === subRole);
    return roleConfig?.color || 'bg-primary';
  };

  const getInitials = (name) =>
    (name || '')
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (filteredStaff.length === 0) {
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
          permissionLabels={permissionLabels}
          viewMode={viewMode}
          setViewMode={setViewMode}
          staffPermissionKeys={staffPermissionKeys}
          billingPermissionKeys={billingPermissionKeys}
          salaryPermissionKeys={salaryPermissionKeys}
        />
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            No staff members found
          </h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Get started by creating a new staff member.'}
          </p>
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
        permissionLabels={permissionLabels}
        viewMode={viewMode}
        setViewMode={setViewMode}
        //
        staffPermissionKeys={staffPermissionKeys}
        billingPermissionKeys={billingPermissionKeys}
        salaryPermissionKeys={salaryPermissionKeys}
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
          permissionLabels={permissionLabels}
          //
          staffPermissionKeys={staffPermissionKeys}
          billingPermissionKeys={billingPermissionKeys}
          salaryPermissionKeys={salaryPermissionKeys}
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

      {/* Results */}
      {viewMode === 'card' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedStaff.map((member) => (
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

      {/* Pagination bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">{startIndex + 1}</span>–
          <span className="font-medium text-foreground">{endIndex}</span> of{' '}
          <span className="font-medium text-foreground">{total}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[6, 12, 24, 48, 96].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
            >
              « First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹ Prev
            </Button>

            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last »
            </Button>
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

export default Staff;
