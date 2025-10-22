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
  "Staff",
  "Permissions",
  "Vendors",
  "Category",
  "WareHouse",
  "Attendance Device",
  "Manage Attendance",
  "Staff Salary",
  "Courier & Shipment",
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
    if (checked) {
      set.add(feat);
    } else {
      set.delete(feat);
      // Clear related limitation when feature is unchecked
      if (feat === 'Staff') setLimit('maxStaff', undefined);
      if (feat === 'Vendors') setLimit('maxVendors', undefined);
      if (feat === 'Category') setLimit('maxProductItems', undefined);
    }
    setFeatures(Array.from(set));
  };

  const removeFeature = (idx) => {
    const featureToRemove = currentFeatures[idx];
    const next = currentFeatures.filter((_, i) => i !== idx);
    setFeatures(next);
    // Clear related limitation when feature is removed
    if (featureToRemove === 'Staff') setLimit('maxStaff', undefined);
    if (featureToRemove === 'Vendors') setLimit('maxVendors', undefined);
    if (featureToRemove === 'Category') setLimit('maxProductItems', undefined);
    onCancel?.();
  };

  const selectAll = () => setFeatures([...ALLOWED_FEATURES]);
  const clearAll = () => {
    setFeatures([]);
    // Clear all conditional limitations when clearing features
    setLimit('maxStaff', undefined);
    setLimit('maxVendors', undefined);
    setLimit('maxProductItems', undefined);
  };

  const readNum = (v) => (v === 0 || typeof v === 'number' ? String(v) : '');
  const writeNum = (s) => (s === '' ? undefined : Number(s));

  return (
    <div className="grid gap-4 py-4">
      {/* Row 1: Plan Name, Validate Days, Price */}
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

      {/* Row 2: Description */}
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

      {/* Row 3: Conditional Limitation Fields */}
      <div className="grid grid-cols-12 gap-4">
        {/* {currentFeatures.includes('Category') && ( */}
          <div className="col-span-4 space-y-2">
            <Label htmlFor={isEditMode ? 'edit-maxProductItems' : 'maxProductItems'}>
              Max Product
            </Label>
            <Input
              id={isEditMode ? 'edit-maxProductItems' : 'maxProductItems'}
              type="number"
              value={readNum(formData.limitations?.maxProductItems)}
              onChange={(e) => setLimit('maxProductItems', writeNum(e.target.value))}
            />
          </div>
        {/* )} */}
        {currentFeatures.includes('Staff') && (
          <div className="col-span-4 space-y-2">
            <Label htmlFor={isEditMode ? 'edit-maxStaff' : 'maxStaff'}>
              Max Staff
            </Label>
            <Input
              id={isEditMode ? 'edit-maxStaff' : 'maxStaff'}
              type="number"
              value={readNum(formData.limitations?.maxStaff)}
              onChange={(e) => setLimit('maxStaff', writeNum(e.target.value))}
            />
          </div>
        )}
        {currentFeatures.includes('Vendors') && (
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
        )}
      </div>

      {/* Row 4: Features */}
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