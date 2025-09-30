'use client';
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const StaffForm = ({ staff, setStaff, isEditMode, onSubmit, isSubmitting, onCancel, subRoles, departments, permissionLabels }) => {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? 'Update the staff member\'s details and permissions.' : 'Create a new staff member with role and permissions.'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${isEditMode ? 'edit-' : ''}name`}>Full Name</Label>
            {/* {console.log("the staff detailo is  :", staff)} */}
            <Input
              id={`${isEditMode ? 'edit-' : ''}name`}
              value={staff?.name}
              onChange={(e) => setStaff({...staff, name: e.target.value})}
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${isEditMode ? 'edit-' : ''}email`}>Email</Label>
            <Input
              id={`${isEditMode ? 'edit-' : ''}email`}
              type="email"
              value={staff?.email}
              onChange={(e) => setStaff({...staff, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${isEditMode ? 'edit-' : ''}subRole`}>Role</Label>
            <Select 
              value={staff?.subRole} 
              onValueChange={(value) => setStaff({...staff, subRole: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {subRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${isEditMode ? 'edit-' : ''}department`}>Department</Label>
            <Select 
              value={staff?.department} 
              onValueChange={(value) => setStaff({...staff, department: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${isEditMode ? 'edit-' : ''}phone`}>Phone</Label>
            <Input
              id={`${isEditMode ? 'edit-' : ''}phone`}
              value={staff?.phone}
              onChange={(e) => setStaff({...staff, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${isEditMode ? 'edit-' : ''}password`}>Password</Label>
            <Input
              id={`${isEditMode ? 'edit-' : ''}password`}
              type="password"
              value={staff?.password}
              onChange={(e) => setStaff({...staff, password: e.target.value})}
              placeholder={isEditMode ? 'Enter new password (optional)' : 'Enter password'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${isEditMode ? 'edit-' : ''}address`}>Address</Label>
          <Input
            id={`${isEditMode ? 'edit-' : ''}address`}
            value={staff?.address}
            onChange={(e) => setStaff({...staff, address: e.target.value})}
            placeholder="Enter address"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">Permissions</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`${isEditMode ? 'edit-' : ''}${key}`}
                  checked={staff?.permissions[key]}
                  onCheckedChange={(checked) => 
                    setStaff({
                      ...staff,
                      permissions: {
                        ...staff?.permissions,
                        [key]: checked
                      }
                    })
                  }
                />
                <Label htmlFor={`${isEditMode ? 'edit-' : ''}${key}`} className="text-sm">{label}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={onSubmit} 
          className="bg-stat-gradient-1 hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Staff Member' : 'Add Staff Member')}
        </Button>
      </div>
    </DialogContent>
  );
};

export default StaffForm;