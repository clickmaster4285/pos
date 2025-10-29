'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getIngredientFields } from '@/utils/industryFields';

export function IngredientModal({
  isOpen,
  onClose,
  onSave,
  ingredient,
  mode,
  industry,
}) {
  const industryFields = getIngredientFields(industry);

  // ---- initialise form with *all* possible fields -------------------------
  const base = {
    name: '',
    SKU: '',
    category: '',
    unit: '',
    costPerUnit: '',
    currentStock: 0,
    supplier: { name: '', contact: '', leadTime: '' },
    storage: 'room',
    expiryDate: '',
    // dynamic fields start empty
    ...Object.fromEntries(industryFields.map((f) => [f.name, ''])),
  };

  const [formData, setFormData] = useState(base);

  // -------------------------------------------------------------------------
  // When modal opens → fill with existing ingredient (edit) or reset (create)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && ingredient) {
      setFormData({
        ...base,
        ...ingredient,
        supplier: ingredient.supplier ?? { name: '', contact: '', leadTime: '' },
        // metaData → flatten into root
        ...(ingredient.metaData ?? {}),
      });
    } else {
      setFormData(base);
    }
  }, [isOpen, mode, ingredient, industry]);

  // -------------------------------------------------------------------------
  const handleChange = useCallback((key, value) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  }, []);

  // -------------------------------------------------------------------------
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const {
        supplier,
        // pull everything else out
        ...rest
      } = formData;

      const payload = {
        ...rest,
        // send supplier only if at least one field is filled
        supplier:
          supplier.name || supplier.contact || supplier.leadTime
            ? supplier
            : null,
      };

      onSave(payload);
    },
    [formData, onSave]
  );

  // -------------------------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add' : 'Edit'} Ingredient
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ---------- Core fields ---------- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label>SKU (optional)</Label>
              <Input
                value={formData.SKU}
                onChange={(e) => handleChange('SKU', e.target.value)}
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => handleChange('category', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'produce',
                    'dairy',
                    'meat',
                    'seafood',
                    'spices',
                    'dry',
                    'frozen',
                    'other',
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => handleChange('unit', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['kg', 'g', 'lb', 'oz', 'l', 'ml', 'piece'].map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cost per Unit *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => handleChange('costPerUnit', e.target.value)}
                required
              />
            </div>

            {/* optional stock for create */}
            {mode === 'create' && (
              <div>
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) =>
                    handleChange('currentStock', Number(e.target.value))
                  }
                />
              </div>
            )}
          </div>

          {/* ---------- Supplier ---------- */}
          <div className="space-y-2">
            <Label>Supplier (optional)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Name"
                value={formData.supplier.name}
                onChange={(e) =>
                  handleChange('supplier.name', e.target.value)
                }
              />
              <Input
                placeholder="Contact"
                value={formData.supplier.contact}
                onChange={(e) =>
                  handleChange('supplier.contact', e.target.value)
                }
              />
              <Input
                type="number"
                placeholder="Lead time (days)"
                value={formData.supplier.leadTime}
                onChange={(e) =>
                  handleChange('supplier.leadTime', e.target.value)
                }
              />
            </div>
          </div>

          {/* ---------- Industry-specific dynamic fields ---------- */}
          {industryFields.map((field) => (
            <div key={field.name}>
              <Label>{field.label}</Label>
              {field.type === 'select' ? (
                <Select
                  value={formData[field.name] ?? ''}
                  onValueChange={(v) => handleChange(field.name, v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type ?? 'text'}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}
            </div>
          ))}

          {/* ---------- Footer ---------- */}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}