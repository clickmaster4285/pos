'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Package } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export function IngredientDetailsSheet({
  open,
  onOpenChange,
  ingredient,
  onEdit,
  onDelete,
  onToggle,
  pending,
}) {
  if (!ingredient) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{ingredient.name}</SheetTitle>
          <SheetDescription>
            SKU: <span className="font-mono">{ingredient.SKU}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h4 className="font-medium mb-2">Basic Info</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Category:</strong> {ingredient.category}</p>
              <p><strong>Unit:</strong> {ingredient.unit}</p>
              <p><strong>Cost per Unit:</strong> ${ingredient.costPerUnit?.toFixed(2)}</p>
              <p><strong>Current Stock:</strong> 
                <span className={ingredient.currentStock === 0 ? 'text-red-600 font-medium' : ''}>
                  {' '}{ingredient.currentStock} {ingredient.unit}
                </span>
              </p>
              <p><strong>Min Stock Level:</strong> {ingredient.minStockLevel || 0}</p>
            </div>
          </div>

          <Separator />

          {ingredient.supplier && (
            <div>
              <h4 className="font-medium mb-2">Supplier</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {ingredient.supplier.name}</p>
                <p><strong>Contact:</strong> {ingredient.supplier.contact}</p>
                <p><strong>Lead Time:</strong> {ingredient.supplier.leadTime} days</p>
              </div>
            </div>
          )}

          {ingredient.nutritionalInfo && Object.keys(ingredient.nutritionalInfo).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Nutrition</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(ingredient.nutritionalInfo).map(([k, v]) => (
                    <p key={k}><strong>{k}:</strong> {v}</p>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Status</h4>
            <Badge variant={ingredient.isActive ? 'default' : 'secondary'}>
              {ingredient.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => onEdit(ingredient)} className="flex-1">
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button variant="outline" onClick={() => onToggle(ingredient)} disabled={pending}>
              {ingredient.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="destructive" onClick={() => onDelete(ingredient)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}