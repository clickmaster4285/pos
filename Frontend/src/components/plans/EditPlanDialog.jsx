// components/EditPlanDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlanForm } from './PlanForm';

export function EditPlanDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  plan,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription>
            Update the details of your subscription plan.
          </DialogDescription>
        </DialogHeader>
        <PlanForm
          formData={formData}
          onFormChange={onFormChange}
          isEditMode={true}
          planName={plan?.name}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Update Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
