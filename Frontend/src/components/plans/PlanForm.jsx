"use client";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Plus, Check, DollarSign, Zap, Shield, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrencyOptions } from './currencyHelper';

const ALLOWED_FEATURES = [
  "Staff", "Permissions", "Vendors", "Category", "WareHouse",
  "Attendance Device", "Manage Attendance", "Staff Salary", "Courier & Shipment",
];

export function PlanForm({ formData, onFormChange, isEditMode, planName, onCancel }) {
  const [featureText] = useState('');

  // Default currency initialization
  useEffect(() => {
    if (!formData.currencyCode) {
      onFormChange({ ...formData, currencyCode: 'USD' });
    }
  }, []);

  const setField = (field, value) => onFormChange({ ...formData, [field]: value });
  const setLimit = (key, value) => onFormChange({
    ...formData,
    limitations: { ...formData.limitations, [key]: value },
  });

  const currentFeatures = Array.isArray(formData.limitations?.features) ? formData.limitations.features : [];
  const setFeatures = (arr) => onFormChange({
    ...formData,
    limitations: { ...formData.limitations, features: arr },
  });

  const toggleFeature = (feat, checked) => {
    const set = new Set(currentFeatures);
    if (checked) set.add(feat);
    else {
      set.delete(feat);
      if (feat === 'Staff') setLimit('maxStaff', undefined);
      if (feat === 'Vendors') setLimit('maxVendors', undefined);
      if (feat === 'Category') setLimit('maxProductItems', undefined);
    }
    setFeatures(Array.from(set));
  };

  const removeFeature = (idx) => {
    const feat = currentFeatures[idx];
    setFeatures(currentFeatures.filter((_, i) => i !== idx));
    if (feat === 'Staff') setLimit('maxStaff', undefined);
    if (feat === 'Vendors') setLimit('maxVendors', undefined);
    if (feat === 'Category') setLimit('maxProductItems', undefined);
    onCancel?.();
  };

  const selectAll = () => setFeatures([...ALLOWED_FEATURES]);
  const clearAll = () => {
    setFeatures([]);
    setLimit('maxStaff', undefined);
    setLimit('maxVendors', undefined);
    setLimit('maxProductItems', undefined);
  };

  const readNum = (v) => (v === 0 || typeof v === 'number' ? String(v) : '');
  const writeNum = (s) => (s === '' ? undefined : Number(s));

  // -------------------------
  // 💰 Price Handling
  // -------------------------
  const [priceInput, setPriceInput] = useState(formData.price ? formData.price.toFixed(2) : '');
  const currencyOptions = getCurrencyOptions();

  useEffect(() => {
    if (formData.price !== undefined && formData.price !== null) {
      setPriceInput(formData.price.toFixed(2));
    } else setPriceInput('');
  }, [formData.price]);

  const handlePriceInput = (e) => {
    let value = e.target.value;
    if (!/^\d{0,9}(\.\d{0,2})?$/.test(value) && value !== '') return;
    setPriceInput(value);
    const parsed = parseFloat(value);
    setField('price', isNaN(parsed) ? undefined : parsed);
  };

  const handlePriceBlur = () => {
    if (!priceInput || isNaN(parseFloat(priceInput))) {
      setPriceInput('');
      setField('price', undefined);
      return;
    }
    const normalized = parseFloat(priceInput).toFixed(2);
    setPriceInput(normalized);
    setField('price', parseFloat(normalized));
  };

  const setCurrency = (code) => setField('currencyCode', code);
  const currencySymbols = { USD: '$', EUR: '€', GBP: '£', PKR: '₨', INR: '₹' };
  const currentSymbol = currencySymbols[formData.currencyCode] || '$';

  return (
    <div className="grid gap-6 py-2">
      {/* Header */}
      {isEditMode && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50/60 to-purple-50/60 rounded-2xl border border-blue-100/50">
          <Zap className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-700">
            Editing: <span className="text-gray-900">{planName}</span>
          </span>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-12 gap-5">
        {/* Name */}
        <div className="col-span-4 space-y-3">
          <Label htmlFor={isEditMode ? 'edit-name' : 'name'} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" /> Plan Name
          </Label>
          <Input
            id={isEditMode ? 'edit-name' : 'name'}
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Enter plan name"
            className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
          />
        </div>

        {/* Validate Days */}
        <div className="col-span-4 space-y-3">
          <Label htmlFor={isEditMode ? 'edit-validateDays' : 'validateDays'} className="text-sm font-semibold text-gray-700">
            Validate Days
          </Label>
          <Input
            id={isEditMode ? 'edit-validateDays' : 'validateDays'}
            type="number"
            value={readNum(formData.validateDays)}
            onChange={(e) => setField('validateDays', writeNum(e.target.value))}
            placeholder="30"
            className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
          />
        </div>

        {/* Price */}
        <div className="col-span-4 space-y-3">
          <Label htmlFor={isEditMode ? 'edit-price' : 'price'} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" /> Price
          </Label>
          <div className="relative">
            <Input
              id={isEditMode ? 'edit-price' : 'price'}
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={handlePriceInput}
              onBlur={handlePriceBlur}
              placeholder="0.00"
              className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium pl-9 pr-3"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">{currentSymbol}</span>
          </div>
        </div>
      </div>

      {/* Currency & Description */}
      <div className="grid grid-cols-12 gap-5 mt-4">
        <div className="col-span-4 space-y-3">
          <Label htmlFor="currency" className="text-sm font-semibold text-gray-700">Currency</Label>
          <Select value={formData.currencyCode || 'USD'} onValueChange={setCurrency}>
            <SelectTrigger className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium">
              <SelectValue placeholder="Select currency…" />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              {currencyOptions.map(([code, label]) => (
                <SelectItem key={code} value={code} className={code === 'USD' ? 'font-semibold text-blue-600' : ''}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-8 space-y-3">
          <Label htmlFor={isEditMode ? 'edit-description' : 'description'} className="text-sm font-semibold text-gray-700">Description</Label>
          <Textarea
            id={isEditMode ? 'edit-description' : 'description'}
            value={formData.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Describe the features and benefits of this plan..."
            rows={3}
            className="border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium resize-none"
          />
        </div>
      </div>

      {/* Limitations */}
      <div className="grid grid-cols-12 gap-5 mt-4">
        <div className="col-span-4 space-y-3">
          <Label htmlFor="maxProductItems" className="text-sm font-semibold text-gray-700">Max Product Items</Label>
          <Input
            id="maxProductItems"
            type="number"
            value={readNum(formData.limitations?.maxProductItems)}
            onChange={(e) => setLimit('maxProductItems', writeNum(e.target.value))}
            className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
          />
        </div>

        {currentFeatures.includes('Staff') && (
          <div className="col-span-4 space-y-3">
            <Label htmlFor="maxStaff" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" /> Max Staff
            </Label>
            <Input
              id="maxStaff"
              type="number"
              value={readNum(formData.limitations?.maxStaff)}
              onChange={(e) => setLimit('maxStaff', writeNum(e.target.value))}
              className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
            />
          </div>
        )}

        {currentFeatures.includes('Vendors') && (
          <div className="col-span-4 space-y-3">
            <Label htmlFor="maxVendors" className="text-sm font-semibold text-gray-700">Max Vendors</Label>
            <Input
              id="maxVendors"
              type="number"
              value={readNum(formData.limitations?.maxVendors)}
              onChange={(e) => setLimit('maxVendors', writeNum(e.target.value))}
              className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
            />
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-4 p-5 bg-gradient-to-br from-gray-50/60 to-white rounded-2xl border border-gray-100/80 mt-4">
        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" /> Features
          <span className="text-xs font-normal text-gray-500 ml-2">({currentFeatures.length} selected)</span>
        </Label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="justify-between w-full h-12 border-2 border-gray-200/80 hover:border-blue-500/50 rounded-xl bg-white/80 font-medium hover:shadow-md">
              <span className={currentFeatures.length ? "text-gray-900" : "text-gray-500"}>
                {currentFeatures.length ? `${currentFeatures.length} features selected` : 'Select features to include'}
              </span>
              <Plus className="h-4 w-4 ml-2 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 rounded-xl border-0 shadow-xl bg-white/95 backdrop-blur-sm p-2">
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-3">
              <span className="font-semibold text-gray-900">Available Features</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100/60" />
            <div className="max-h-60 overflow-y-auto py-1">
              {ALLOWED_FEATURES.map((feat) => {
                const checked = currentFeatures.includes(feat);
                return (
                  <DropdownMenuCheckboxItem
                    key={feat}
                    checked={checked}
                    onCheckedChange={(val) => toggleFeature(feat, !!val)}
                    className="rounded-lg py-2.5 px-3 hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-150 font-medium capitalize"
                  >
                    <span className="flex items-center gap-3">
                      {checked ? <Check className="h-4 w-4 text-blue-600 font-bold" /> : <span className="h-4 w-4 border-2 border-gray-300 rounded" />}
                      {feat.replace(/_/g, ' ')}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </div>
            <DropdownMenuSeparator className="bg-gray-100/60" />
            <div className="px-2 py-2 flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={selectAll} className="flex-1 h-9 rounded-lg font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200">Select all</Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearAll} className="flex-1 h-9 rounded-lg font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200">Clear</Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentFeatures.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-3">
            {currentFeatures.map((f, idx) => (
              <span key={`${f}-${idx}`} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm hover:shadow-md">
                {f.replace(/_/g, ' ')}
                <button type="button" onClick={() => removeFeature(idx)} className="opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-150" aria-label={`Remove ${f}`} title={`Remove ${f}`}>
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
