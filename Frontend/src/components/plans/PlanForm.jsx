// components/PlanForm.jsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Plus, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Allowed selectable features (fixed list)
const ALLOWED_FEATURES = [
  'analytics',
  'reports',
  'inventory_management',
  'vendor_management',
  'order_tracking',
  'support',
];

export function PlanForm({
  formData,
  onFormChange,
  isEditMode,
  planName,
  onCancel,
}) {
  const [featureText] = useState(''); // kept to avoid touching other logic

  const setField = (field, value) =>
    onFormChange({ ...formData, [field]: value });

  const setLimit = (key, value) =>
    onFormChange({
      ...formData,
      limitations: { ...formData.limitations, [key]: value },
    });

  const currentFeatures = Array.isArray(formData.limitations?.features)
    ? formData.limitations.features
    : [];

  const setFeatures = (arr) =>
    onFormChange({
      ...formData,
      limitations: { ...formData.limitations, features: arr },
    });

  const toggleFeature = (feat, checked) => {
    const set = new Set(currentFeatures);
    if (checked) set.add(feat);
    else set.delete(feat);
    setFeatures(Array.from(set));
  };

  const removeFeature = (idx) => {
    const next = currentFeatures.filter((_, i) => i !== idx);
    setFeatures(next);
    onCancel?.();
  };

  const selectAll = () => setFeatures([...ALLOWED_FEATURES]);
  const clearAll = () => setFeatures([]);
  const readNum = (v) => (v === 0 || typeof v === 'number' ? String(v) : ''); // for value=
  const writeNum = (s) => (s === '' ? undefined : Number(s)); // for onChange

  return (
    <div className="grid gap-4 py-4">
      {/* Row 1: 4 fields - properly aligned */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 space-y-2">
          <Label htmlFor={isEditMode ? 'edit-name' : 'name'}>
            {isEditMode ? `Editing: ${planName}` : 'Plan Name'}
          </Label>
          <Input
            id={isEditMode ? 'edit-name' : 'name'}
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Enter plan name"
          />
        </div>
        <div className="col-span-4 space-y-2">
          <Label htmlFor={isEditMode ? 'edit-validateDays' : 'validateDays'}>
            Validate Days
          </Label>
          <Input
            id={isEditMode ? 'edit-validateDays' : 'validateDays'}
            type="number"
            value={readNum(formData.validateDays)}
            onChange={(e) => setField('validateDays', writeNum(e.target.value))}
            placeholder="30"
          />
        </div>
        <div className="col-span-4 space-y-2">
          <Label htmlFor={isEditMode ? 'edit-price' : 'price'}>Price</Label>
          <Input
            id={isEditMode ? 'edit-price' : 'price'}
            type="number"
            step="1"
            value={readNum(formData.price)}
            onChange={(e) => setField('price', writeNum(e.target.value))}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Row 2: Description - spans full width */}
      <div className="space-y-2">
        <Label htmlFor={isEditMode ? 'edit-description' : 'description'}>
          Description
        </Label>
        <Textarea
          id={isEditMode ? 'edit-description' : 'description'}
          value={formData.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Enter plan description"
          rows={3}
        />
      </div>

      {/* Row 3: 3 limitation fields - equal width */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 space-y-2">
          <Label
            htmlFor={
              isEditMode ? 'edit-maxInventoryItems' : 'maxInventoryItems'
            }
          >
            Max Inventory
          </Label>
          <Input
            id={isEditMode ? 'edit-maxInventoryItems' : 'maxInventoryItems'}
            type="number"
            value={readNum(formData.limitations?.maxInventoryItems)}
            onChange={(e) =>
              setLimit('maxInventoryItems', writeNum(e.target.value))
            }
          />
        </div>
        <div className="col-span-4 space-y-2">
          <Label htmlFor={isEditMode ? 'edit-maxStaff' : 'maxStaff'}>
            Max Users
          </Label>
          <Input
            id={isEditMode ? 'edit-maxStaff' : 'maxStaff'}
            type="number"
            value={readNum(formData.limitations?.maxStaff)}
            onChange={(e) => setLimit('maxStaff', writeNum(e.target.value))}
          />
        </div>
        <div className="col-span-4 space-y-2">
          <Label htmlFor={isEditMode ? 'edit-maxVendors' : 'maxVendors'}>
            Max Vendors
          </Label>
          <Input
            id={isEditMode ? 'edit-maxVendors' : 'maxVendors'}
            type="number"
            value={readNum(formData.limitations?.maxVendors)}
            onChange={(e) => setLimit('maxVendors', writeNum(e.target.value))}
          />
        </div>
      </div>

      {/* Row 4: Features (multi-select dropdown from ALLOWED_FEATURES) */}
      <div className="space-y-2">
        <Label>Features</Label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-between w-full"
            >
              {currentFeatures.length
                ? `${currentFeatures.length} selected`
                : 'Select features'}
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
              Select features
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALLOWED_FEATURES.map((feat) => {
              const checked = currentFeatures.includes(feat);
              return (
                <DropdownMenuCheckboxItem
                  key={feat}
                  checked={checked}
                  onCheckedChange={(val) => toggleFeature(feat, !!val)}
                  className="capitalize"
                >
                  <span className="flex items-center gap-2">
                    {checked ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="h-4 w-4" />
                    )}
                    {feat.replace(/_/g, ' ')}
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={selectAll}
              >
                Select all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearAll}
              >
                Clear
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {currentFeatures.map((f, idx) => (
              <span
                key={`${f}-${idx}`}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
              >
                {f.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="opacity-70 hover:opacity-100"
                  aria-label={`Remove ${f}`}
                  title={`Remove ${f}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
