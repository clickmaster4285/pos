'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanCard } from '@/components/plans/PlanCard';
import { PlanFilters } from '@/components/plans/PlanFilters';
import { CreatePlanDialog } from '@/components/plans/CreatePlanDialog';
import { EditPlanDialog } from '@/components/plans/EditPlanDialog';
import { EmptyState } from '@/components/plans/EmptyState';
import {
  useGetAllPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} from '@/features/planApi';
import { Plus } from 'lucide-react';

export default function PlanManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    validateDays: 0, // optional
    limitations: {
      maxStaff: 0,
      maxInventoryItems: 0,
      maxVendors: 0,
      features: [], // array of strings
    },
    isActive: true, // boolean
  });

  const { data: apiPlans = [], isLoading, error } = useGetAllPlansQuery();

  const [createPlan] = useCreatePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();

  const plans = useMemo(() => {
    return apiPlans.filter(Boolean).map((p) => ({
      id: p._id,
      name: p.name ?? '',
      description: p.description ?? '',
      validateDays: p.validateDays ?? '',
      price: Number(p.price ?? 0),
      maxVehicles: p.limitations?.maxInventoryItems ?? 0,
      maxUsers: p.limitations?.maxStaff ?? 0,
      maxVendors: p.limitations?.maxVendors ?? 0,
      features: Array.isArray(p.features)
        ? p.features
        : p.limitations?.features ?? [],
      status: p.isActive ? 'Active' : 'Inactive',
      createdAt: p.createdAt?.slice(0, 10) ?? '',
      updatedAt: p.updatedAt?.slice(0, 10) ?? '',
      type: p.type ?? 'Basic',
    }));
  }, [apiPlans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' || plan.status === filterStatus;

      const matchesType = filterType === 'all' || plan.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [plans, searchTerm, filterStatus, filterType]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      validateDays: 0, // optional
      limitations: {
        maxStaff: 0,
        maxInventoryItems: 0,
        maxVendors: 0,
        features: [], // array of strings
      },
      isActive: true, // boolean
    });
  };

  const handleCreatePlan = async () => {
    try {
      const newPlan = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        validateDays: Number(formData.validateDays || 0),
        limitations: {
          maxStaff: Number(formData.limitations.maxStaff || 0),
          maxInventoryItems: Number(
            formData.limitations.maxInventoryItems || 0
          ),
          maxVendors: Number(formData.limitations.maxVendors || 0),
          features: Array.isArray(formData.limitations.features)
            ? formData.limitations.features
            : [],
        },
        isActive: !!formData.isActive,
      };

      await createPlan(newPlan).unwrap();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name ?? '',
      description: plan.description ?? '',
      price: Number(plan.price ?? 0),
      validateDays: Number(plan.validateDays ?? 0),
      limitations: {
        maxStaff: Number(plan.maxUsers ?? plan.limitations?.maxStaff ?? 0),
        maxInventoryItems: Number(
          plan.maxVehicles ?? plan.limitations?.maxInventoryItems ?? 0
        ),
        maxVendors: Number(
          plan.maxVendors ?? plan.limitations?.maxVendors ?? 0
        ),
        // Prefer plan.features if PlanCard flattens it; otherwise use nested:
        features: Array.isArray(plan.features)
          ? plan.features
          : Array.isArray(plan.limitations?.features)
          ? plan.limitations.features
          : [],
      },
      isActive: plan.status ? plan.status === 'Active' : !!plan.isActive,
    });
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const updatedPlan = {
        id: editingPlan.id,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        validateDays: Number(formData.validateDays || 0),
        limitations: {
          maxStaff: Number(formData.limitations.maxStaff || 0),
          maxInventoryItems: Number(
            formData.limitations.maxInventoryItems || 0
          ),
          maxVendors: Number(formData.limitations.maxVendors || 0),
          features: Array.isArray(formData.limitations.features)
            ? formData.limitations.features
            : [],
        },
        isActive: !!formData.isActive,
      };

      await updatePlan(updatedPlan).unwrap();
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await deletePlan(planId).unwrap();
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="bg-background">
      <HeaderSection onCreatePlanClick={() => setIsCreateDialogOpen(true)} />

      <div className="mx-auto px-6 py-6">
        <PlanFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
        />

        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => handleEditPlan(plan)}
                onDelete={() => handleDeletePlan(plan.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <CreatePlanDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleCreatePlan}
        onCancel={() => {
          setIsCreateDialogOpen(false);
          resetForm();
        }}
      />

      <EditPlanDialog
        isOpen={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        plan={editingPlan}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleUpdatePlan}
        onCancel={() => {
          setEditingPlan(null);
          resetForm();
        }}
      />
    </div>
  );
}

function HeaderSection({ onCreatePlanClick }) {
  return (
    <div className="">
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance mt-4">
              Plan Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage subscription plans for your automotive software platform
            </p>
          </div>
          <Button
            onClick={onCreatePlanClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="px-6 py-10 text-muted-foreground">Loading plans…</div>;
}

function ErrorState() {
  return (
    <div className="px-6 py-10 text-destructive">Failed to load plans.</div>
  );
}
