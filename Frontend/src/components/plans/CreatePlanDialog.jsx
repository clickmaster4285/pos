// components/CreatePlanDialog.jsx
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

export function CreatePlanDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        if (!open) onCancel?.(); // ← ensures close = clear
      }}
    >
      {/* wider */}
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>
            Add a new subscription plan for your automotive software platform.
          </DialogDescription>
        </DialogHeader>

        <PlanForm
          formData={formData}
          onFormChange={onFormChange}
          isEditMode={false}
          onCancel={onCancel}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
