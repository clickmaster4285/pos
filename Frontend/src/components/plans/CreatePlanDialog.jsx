// src/components/plans/CreatePlanDialog.jsx
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
        if (!open) onCancel?.();
      }}
    >
      <DialogContent className="max-w-6xl bg-linear-to-br from-white to-gray-50/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
        <div className="relative">
          {/* Modern accent elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-linear-to-r from-emerald-400 to-cyan-500 rounded-full blur-sm opacity-20"></div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-full blur-sm opacity-15"></div>

          <DialogHeader className="relative z-10 pb-6 border-b border-gray-100/60">
            <DialogTitle className="text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Create New Plan
            </DialogTitle>
            <DialogDescription className="text-base text-gray-500 mt-2">
              Design a powerful subscription plan for your automotive software
              platform
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 max-h-[65vh] overflow-y-auto pr-2 custom-scroll">
            <PlanForm
              formData={formData}
              onFormChange={onFormChange}
              isEditMode={false}
              onCancel={onCancel}
            />
          </div>

          <DialogFooter className="relative z-10 pt-6 border-t border-gray-100/60">
            <Button
              variant="outline"
              onClick={onCancel}

            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}

            >
              Create Plan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
