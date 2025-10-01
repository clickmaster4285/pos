'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useGetAllStaffQuery, useCreateStaffMutation, useUpdateStaffMutation, useDeleteStaffMutation } from '@/features/staffApi';
import StaffHeader from './StaffHeader';
import StaffFilter from './StaffFilter';
import StaffForm from './StaffForm';
import StaffCard from './StaffCard';
import StaffTable from './StaffTable';

const Staff = () => {
  const { data: staff = [], isLoading, error } = useGetAllStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
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
      manageInventory: false,
      manageVendors: false,
      assignTasks: false,
      approveRequests: false,
      manageAppointments: false,
      manageTeams: false,
      managePlans: false
    }
  });
  const [editStaff, setEditStaff] = useState(null);

  const subRoles = [
    { value: 'manager', label: 'Manager', color: 'bg-chart-1' },
    { value: 'receptionist', label: 'Receptionist', color: 'bg-chart-2' },
    { value: 'mechanic', label: 'Mechanic', color: 'bg-chart-3' },
    { value: 'seller', label: 'Seller', color: 'bg-chart-4' }
  ];

  const departments = ['Engineering', 'Front Office', 'Service', 'Sales', 'Admin'];

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
    managePlans: 'Manage Plans'
  };

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.subRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          managePlans: false
        }
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.warn("Failed to create staff member.");
    }
  };

  const handleUpdateStaff = async () => {
    if (!editStaff?._id) return;
    try {
      await updateStaff({ _id: editStaff._id, ...editStaff }).unwrap();
      setEditStaff(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.warn("Failed to update staff member.");
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await deleteStaff(id).unwrap();
      console.warn("Staff member deleted successfully.");
    } catch (error) {
      console.warn("Failed to delete staff member.");
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
      permissions: member.permissions
    });
    setIsEditDialogOpen(true);
  };

  const getRoleColor = (subRole) => {
    const roleConfig = subRoles.find(role => role.value === subRole);
    return roleConfig?.color || 'bg-muted';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredStaff.length === 0) {
    return (
      <Card className="shadow-lg backdrop-blur-sm bg-card/80 border border-border/50">
          {/* {!searchTerm && ( */}
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
            />
          {/* )} */}
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">No staff members found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new staff member.'}
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
        />
      </Dialog>

      <StaffFilter 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {viewMode === 'card' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((member) => (
            <StaffCard 
              key={member._id}
              member={member}
              handleEditClick={handleEditClick}
              handleDeleteStaff={handleDeleteStaff}
              getRoleColor={getRoleColor}
              getInitials={getInitials}
              permissionLabels={permissionLabels}
            />
          ))}
        </div>
      ) : (
        <StaffTable
          staff={filteredStaff}
          handleEditClick={handleEditClick}
          handleDeleteStaff={handleDeleteStaff}
          getRoleColor={getRoleColor}
          getInitials={getInitials}
          permissionLabels={permissionLabels}
        />
      )}
    </div>
  );
};

export default Staff;