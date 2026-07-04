'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Plus, Check, DollarSign, Zap, Shield, Users, Boxes, Package } from 'lucide-react';
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { ChevronsUpDown } from 'lucide-react';



const ALLOWED_FEATURES = [
  'Branch',
  'Staff',
  'Permissions',
  'Vendors',
  'Category',
  'WareHouse',
  'Attendance Device',
  'Manage Attendance',
  'Staff Salary',
  'Courier & Shipment',
];

// Simple cache for rates
const exchangeRates = { USD: 1 };
let ratesLoaded = false;

export function PlanForm({
  formData,
  onFormChange,
  isEditMode,
  planName,
  onCancel,
}) {
  // Price is local for typing – we don't sync back from formData
  const [priceInput, setPriceInput] = useState('');
  const [priceValid, setPriceValid] = useState(null); // null | true | false
  const [loadingRates, setLoadingRates] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);


  const limitations = formData.limitations || {};
  const currentFeatures = Array.isArray(limitations.features)
    ? limitations.features
    : [];

  // Default currency once
  useEffect(() => {
    if (!formData.currencyCode) {
      onFormChange({ ...formData, currencyCode: 'USD' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //currency
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyOptions = getCurrencyOptions();

  // Get current label for button


  const currentCurrencyLabel =
    currencyOptions.find(
      ([code]) => code === (formData.currencyCode || '')
    )?.[1] || 'Select currency';

  // Load exchange rates
  useEffect(() => {
    const loadRates = async () => {
      if (ratesLoaded && exchangeRates[formData.currencyCode]) return;

      setLoadingRates(true);
      try {
        const res = await fetch(
          'https://api.exchangerate-api.com/v4/latest/USD'
        );
        const data = await res.json();
        Object.keys(data.rates).forEach((code) => {
          exchangeRates[code] = data.rates[code];
        });
        ratesLoaded = true;
      } catch (err) {
        console.error('Failed to load rates', err);
      } finally {
        setLoadingRates(false);
      }
    };

    if (formData.currencyCode) {
      loadRates();
    }
  }, [formData.currencyCode]);

  const setField = (field, value) =>
    onFormChange({ ...formData, [field]: value });

  const updateLimitations = (patch) => {
    const prev = formData.limitations || {};
    onFormChange({
      ...formData,
      limitations: {
        ...prev,
        ...patch,
      },
    });
  };

  const setLimit = (key, value) => {
    updateLimitations({ [key]: value });
  };

  const readNum = (v) => (v === 0 || typeof v === 'number' ? String(v) : '');
  const writeNum = (s) => (s === '' ? undefined : Number(s));

  // === PRICE HANDLERS ===
  const handlePriceInput = (e) => {
    const value = e.target.value;

    // Allow only numeric with 0–2 decimals
    if (!/^\d*\.?\d{0,2}$/.test(value) && value !== '') return;

    setPriceInput(value);
    setPriceValid(null);
  };

  const handlePriceBlur = () => {
    if (!priceInput) {
      // nothing typed → reset
      setPriceValid(null);
      setField('price', undefined);
      return;
    }

    const num = parseFloat(priceInput);

    if (isNaN(num) || num < 0) {
      setField('price', undefined);
      setPriceValid(false);
      // keep what user typed so they can fix it
      return;
    }

    const rate = exchangeRates[formData.currencyCode] || 1;
    const priceInUSD = num / rate;
    const isValid = priceInUSD === 0 || priceInUSD >= 0.5;

    if (isValid) {
      setField('price', num);
      setPriceValid(true);
    } else {
      setField('price', undefined);
      setPriceValid(false);
    }

    // ❌ remove: setPriceInput('');
    // we leave priceInput as-is so user still sees it
  };

  // === CURRENCY ===
  const setCurrency = (code) => {
    setField('currencyCode', code);

    // Optional: re-validate existing stored price
    if (formData.price != null && !isNaN(Number(formData.price))) {
      const num = Number(formData.price);
      const rate = exchangeRates[code] || 1;
      const priceInUSD = num / rate;
      const isValid = priceInUSD === 0 || priceInUSD >= 0.5;
      setPriceValid(isValid);
      if (!isValid) {
        setField('price', undefined);
      }
    }
  };

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: '₨',
    INR: '₹',
  };
  const currentSymbol = currencySymbols[formData.currencyCode] || '$';

  // === FEATURES ===
  const toggleFeature = (feat, checked) => {
    let newFeatures;
    if (checked) {
      newFeatures = Array.from(new Set([...currentFeatures, feat]));
    } else {
      newFeatures = currentFeatures.filter((f) => f !== feat);
    }

    const patch = { features: newFeatures };

    if (!checked) {
      if (feat === 'Branch') patch.maxBranch = undefined;
      if (feat === 'Staff') patch.maxStaff = undefined;
      if (feat === 'Vendors') patch.maxVendors = undefined;
      if (feat === 'Category') patch.maxProductItems = undefined;
    }

    updateLimitations(patch);
  };

  const removeFeature = (featToRemove) => {
    toggleFeature(featToRemove, false);
  };

  const selectAll = () => {
    updateLimitations({ features: [...ALLOWED_FEATURES] });
    setDropdownOpen(false);
  };

  const clearAll = () => {
    const { maxBranch, maxStaff, maxVendors, maxProductItems, ...rest } = limitations;
    updateLimitations({
      ...rest,
      features: [],
      maxBranch: undefined,
      maxStaff: undefined,
      maxVendors: undefined,
      maxProductItems: undefined,
    });
    setDropdownOpen(false);
  };

  // Price styles
  const inputBorder =
    priceValid === false
      ? 'border-red-500 focus:border-red-600'
      : priceValid === true
        ? 'border-green-500 focus:border-green-600'
        : 'border-gray-200/80 focus:border-blue-500/50';

  const iconColor =
    priceValid === true
      ? 'text-green-600'
      : priceValid === false
        ? 'text-red-600'
        : 'text-gray-400';

  return (
    <div className="grid gap-6 py-2">
      {/* Header */}
      {isEditMode && (
        <div className="flex items-center gap-3 p-4 bg-linear-to-r from-blue-50/60 to-purple-50/60 rounded-2xl border border-blue-100/50">
          <Zap className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-700">
            Editing: <span className="text-gray-900">{planName}</span>
          </span>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid gap-5 md:grid-cols-12">
        {/* Name */}
        <div className="md:col-span-4 space-y-3">
          <Label
            htmlFor={isEditMode ? 'edit-name' : 'name'}
            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
          >
            <Shield className="h-4 w-4 text-blue-600" /> Plan Name
          </Label>
          <Input
            id={isEditMode ? 'edit-name' : 'name'}
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Enter plan name"
            className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
          />
        </div>

        {/* Validate Days */}
        <div className="md:col-span-4 space-y-3">
          <Label
            htmlFor={isEditMode ? 'edit-validateDays' : 'validateDays'}
            className="text-sm font-semibold text-gray-700"
          >
            Validate Days
          </Label>
          <Input
            id={isEditMode ? 'edit-validateDays' : 'validateDays'}
            type="number"
            value={readNum(formData.validateDays)}
            onChange={(e) => setField('validateDays', writeNum(e.target.value))}
            placeholder="30"
            className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
          />
        </div>

        {/* Price */}
        <div className="md:col-span-4 space-y-3">
          <Label
            htmlFor={isEditMode ? 'edit-price' : 'price'}
            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
          >
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
              className={`h-12 border-2 pl-9 pr-10 rounded-xl font-medium bg-white/80 backdrop-blur-sm transition-all duration-200 ${inputBorder}`}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
              {loadingRates ? '...' : currentSymbol}
            </span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {priceValid === true && (
                <Check className={`h-5 w-5 ${iconColor}`} />
              )}
              {priceValid === false && <X className={`h-5 w-5 ${iconColor}`} />}
            </div>
          </div>
        </div>
      </div>

      {/* Currency & Description */}
      <div className="grid gap-5 mt-4 md:grid-cols-12">
        <div className="md:col-span-4 space-y-3">
          <Label
            htmlFor="currency"
            className="text-sm font-semibold text-gray-700"
          >
            Currency
          </Label>

          <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full max-w-xs justify-between h-12 border-2 border-gray-200/80 rounded-xl bg-white/80 font-medium hover:border-blue-500/50"
              >
                <span
                  className={
                    formData.currencyCode ? 'text-gray-900' : 'text-gray-500'
                  }
                >
                  {currentCurrencyLabel}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-60" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-72 p-0 rounded-xl border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <Command>
                {/* Built-in search (no extra state) */}
                <CommandInput
                  placeholder="Search currency..."
                  className="h-9 text-sm"
                />

                <CommandEmpty className="py-2 text-center text-sm text-gray-500">
                  No currency found.
                </CommandEmpty>

                <CommandGroup className="max-h-60 overflow-y-auto">
                  {currencyOptions.map(([code, label]) => (
                    <CommandItem
                      key={code}
                      // 👇 IMPORTANT: use label for searching, so "dollar" matches "US Dollar"
                      value={label.toLowerCase()}
                      onSelect={() => {
                        setCurrency(code);
                        setCurrencyOpen(false);
                      }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check
                        className={
                          code === formData.currencyCode
                            ? 'h-4 w-4 text-blue-600 opacity-100'
                            : 'h-4 w-4 opacity-0'
                        }
                      />
                      <span>{label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-8 space-y-3">
          <Label
            htmlFor={isEditMode ? 'edit-description' : 'description'}
            className="text-sm font-semibold text-gray-700"
          >
            Description
          </Label>
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
      <div className="grid gap-5 mt-4 md:grid-cols-12">
        <div className="md:col-span-4 space-y-3">
          <Label
            htmlFor="maxProductItems"
            className="text-sm font-semibold text-gray-700"
          >
            {' '}
            <Boxes className="h-4 w-4 text-orange-600" />
            Max Product Items
          </Label>
          <Input
            id="maxProductItems"
            type="number"
            value={readNum(limitations.maxProductItems)}
            onChange={(e) =>
              setLimit('maxProductItems', writeNum(e.target.value))
            }
            className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
          />
        </div>

        {currentFeatures.includes('Branch') && (
          <div className="md:col-span-4 space-y-3">
            <Label
              htmlFor="maxBranch"
              className="text-sm font-semibold text-gray-700 flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-blue-600" /> Max Branch
            </Label>
            <Input
              id="maxBranch"
              type="number"
              value={readNum(limitations.maxBranch)}
              onChange={(e) => setLimit('maxBranch', writeNum(e.target.value))}
              className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
            />
          </div>
        )}

        {currentFeatures.includes('Staff') && (
          <div className="md:col-span-4 space-y-3">
            <Label
              htmlFor="maxStaff"
              className="text-sm font-semibold text-gray-700 flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-blue-600" /> Max Staff
            </Label>
            <Input
              id="maxStaff"
              type="number"
              value={readNum(limitations.maxStaff)}
              onChange={(e) => setLimit('maxStaff', writeNum(e.target.value))}
              className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
            />
          </div>
        )}

        {currentFeatures.includes('Vendors') && (
          <div className="md:col-span-4 space-y-3">
            <Label
              htmlFor="maxVendors"
              className="text-sm font-semibold text-gray-700"
            >
              {' '}
              <Package className="h-4 w-4 text-green-600" />
              Max Vendors
            </Label>
            <Input
              id="maxVendors"
              type="number"
              value={readNum(limitations.maxVendors)}
              onChange={(e) => setLimit('maxVendors', writeNum(e.target.value))}
              className="h-12 border-2 border-gray-200/80 focus:border-blue-500/50 rounded-xl bg-white/80 font-medium"
            />
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-4 p-5 bg-linear-to-br from-gray-50/60 to-white rounded-2xl border border-gray-100/80 mt-4">
        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" /> Features
          <span className="text-xs font-normal text-gray-500 ml-2">
            ({currentFeatures.length} selected)
          </span>
        </Label>

        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-between w-full h-12 border-2 border-gray-200/80 hover:border-blue-500/50 rounded-xl bg-white/80 font-medium hover:shadow-md"
            >
              <span
                className={
                  currentFeatures.length ? 'text-gray-900' : 'text-gray-500'
                }
              >
                {currentFeatures.length
                  ? `${currentFeatures.length} features selected`
                  : 'Select features to include'}
              </span>
              <Plus className="h-4 w-4 ml-2 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-72 rounded-xl border-0 shadow-xl bg-white/95 backdrop-blur-sm p-2"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-3">
              <span className="font-semibold text-gray-900">
                Available Features
              </span>
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
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="flex items-center gap-3">
                      {checked ? (
                        <Check className="h-4 w-4 text-blue-600 font-bold" />
                      ) : (
                        <span className="h-4 w-4 border-2 border-gray-300 rounded" />
                      )}
                      {feat.replace(/_/g, ' ')}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </div>

            <DropdownMenuSeparator className="bg-gray-100/60" />
            <div className="px-2 py-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={selectAll}
                className="flex-1 h-9 rounded-lg font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                Select all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearAll}
                className="flex-1 h-9 rounded-lg font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                Clear
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentFeatures.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-3">
            {currentFeatures.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-linear-to-r from-blue-50 to-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm hover:shadow-md"
              >
                {feature.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-150"
                  aria-label={`Remove ${feature}`}
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
