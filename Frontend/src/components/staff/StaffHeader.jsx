'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus, LayoutGrid, Table } from 'lucide-react';
import StaffForm from './StaffForm';
import { useContext } from 'react';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
const StaffHeader = ({
  isAddDialogOpen,
  setIsAddDialogOpen,
  newStaff,
  setNewStaff,
  handleAddStaff,
  isCreating,
  subRoles,
  departments,
  permissionLabels,
  viewMode,
  setViewMode,
}) => {
  const { user } = useContext(AuthContext) || {};
  const addPermission = user?.permissions?.staffCreate;

  return (
    <div className="flex items-center justify-between  pt-6">
      <div>
        <h1 className="text-3xl font-medium text-foreground">
          Staff Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your team with ease and precision
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-card rounded-md p-1 shadow-sm border border-border/50">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            className={`px-3 py-2 ${
              viewMode === 'card'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            } hover:bg-primary/90 transition-all duration-300`}
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            className={`px-3 py-2 ${
              viewMode === 'table'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            } hover:bg-primary/90 transition-all duration-300`}
            onClick={() => setViewMode('table')}
          >
            <Table className="h-4 w-4 mr-2" />
          </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all duration-300"
                disabled={!addPermission}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <StaffForm
            staff={newStaff}
            setStaff={setNewStaff}
            isEditMode={false}
            onSubmit={handleAddStaff}
            isSubmitting={isCreating}
            onCancel={() => setIsAddDialogOpen(false)}
            subRoles={subRoles}
            departments={departments}
            permissionLabels={permissionLabels}
          />
        </Dialog>
      </div>
    </div>
  );
};

export default StaffHeader;
