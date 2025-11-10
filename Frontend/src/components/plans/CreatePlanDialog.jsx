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
      <DialogContent className="max-w-6xl bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
        <div className="relative">
          {/* Modern accent elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full blur-sm opacity-20"></div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-sm opacity-15"></div>
          
          <DialogHeader className="relative z-10 pb-6 border-b border-gray-100/60">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Create New Plan
            </DialogTitle>
            <DialogDescription className="text-base text-gray-500 mt-2">
              Design a powerful subscription plan for your automotive software platform
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
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
              className="h-11 px-6 font-semibold border-2 border-gray-200/80 hover:border-gray-300 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              className="h-11 px-8 font-bold bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              Create Plan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}