// ProductModal.jsx
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tag, X, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { getProductFields } from '@/utils/industryFields';
import { useSelector } from 'react-redux';
import { useCreateCategoryMutation } from '@/features/categoryApi';
import { useCreateVendorMutation } from '@/features/vendorApi';
import { useCreateIngredientMutation } from '@/features/ingredientApi';

const CategoryModal = dynamic(
  () =>
    import('@/components/category/CategoryModal').then(
      (m) => m.default ?? m.CategoryModal
    ),
  { ssr: false }
);
import { VendorModal } from '@/components/vendors/vendor-modal';
import { IngredientModal } from '@/components/ingredients/IngredientModal';

const useIndustry = (user) => user?.industryName;
const useFeatureFlags = (user) => ({
  hasCategories: (user?.extraFeature || []).includes('Category'),
  hasVendors: (user?.extraFeature || []).includes('Vendors'),
});

export const ProductModal = memo(function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  mode,
  categories = [],
  vendors = [],
  ingredients = [],
}) {
  const user = useSelector((state) => state.auth.user);
  const industry = useIndustry(user);
  const { hasCategories, hasVendors } = useFeatureFlags(user);

  const industryFields = useMemo(() => getProductFields(industry), [industry]);

  /* ----------------------------------------------------------------- */
  /*  MANUAL FIELDS – never added by dynamic loop                      */
  /* ----------------------------------------------------------------- */
  const MANUAL_FIELDS = useMemo(
    () =>
      new Set([
        'productName',
        'description',
        'tags',
        'productImage',
        'SKU',
        ...(hasCategories ? ['category', 'subCategoryName'] : []),
        ...(hasVendors ? ['vendor'] : []),
      ]),
    [hasCategories, hasVendors]
  );

  const dynamicFields = useMemo(() => {
    return industryFields.filter((f) => !MANUAL_FIELDS.has(f.name));
  }, [industryFields, MANUAL_FIELDS]);

  const emptyForm = () => ({
    id: '',
    productName: '',
    description: '',
    tags: [],
    imgUrl: [],
    productImage: [],
    ingredients: [],
    category: '',
    subCategoryName: '',
    vendor: '',
    SKU: '',
    isAutoSKU: true,
    ...industryFields.reduce((acc, f) => {
      if (f.type === 'ingredients-array') acc[f.name] = [];
      else if (f.type === 'checkbox') acc[f.name] = false;
      else acc[f.name] = '';
      return acc;
    }, {}),
  });

  const [formData, setFormData] = useState(emptyForm());
  const [newTag, setNewTag] = useState('');
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [localCategories, setLocalCategories] = useState(categories);
  const [localVendors, setLocalVendors] = useState(vendors);
  const [localIngredients, setLocalIngredients] = useState(ingredients);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);

  const [createCategory] = useCreateCategoryMutation();
  const [createVendor] = useCreateVendorMutation();
  const [createIngredient] = useCreateIngredientMutation();

  useEffect(() => setLocalCategories(categories), [categories]);
  useEffect(() => setLocalVendors(vendors), [vendors]);
  useEffect(() => setLocalIngredients(ingredients), [ingredients]);

  /* ----------------------------------------------------------------- */
  /*  Reset form when dialog opens/closes                               */
  /* ----------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) {
      setFormData(emptyForm());
      setNewTag('');
      return;
    }

    if (product) {
      const base = {
        id: product.id || product._id || '',
        productName: product.productName || '',
        description: product.description || '',
        tags: product.tags || [],
        vendor: product.vendor?._id || product.vendor || '',
        imgUrl: Array.isArray(product.imgUrl)
          ? product.imgUrl
          : product.imgUrl
          ? [product.imgUrl]
          : [],
        productImage: [],
        ingredients: Array.isArray(product.ingredient)
          ? product.ingredient.map((i) => ({
              ingredientId: i.ingredientId?._id || i.ingredientId || '',
              ingredientName: i.ingredientName || '',
              quantity: i.quantity || '',
              unit: i.unit || '',
            }))
          : [],
        category: product.category?._id || product.category || '',
        subCategoryName: product.subCategoryName || '',
        SKU: product.SKU || '',
        isAutoSKU: !product.SKU,
      };

      const dyn = {};
      industryFields.forEach((f) => {
        dyn[f.name] = product[f.name] ?? (f.type === 'checkbox' ? false : '');
      });

      setFormData({ ...emptyForm(), ...base, ...dyn });
    } else {
      setFormData(emptyForm());
    }
  }, [product, isOpen, industryFields]);

  /* ----------------------------------------------------------------- */
  /*  Sub-category list – updates when category changes                 */
  /* ----------------------------------------------------------------- */
  useEffect(() => {
    if (!hasCategories || !formData.category) {
      setAvailableSubCategories([]);
      return;
    }
    const cat = localCategories.find((c) => c._id === formData.category);
    const subs = cat?.subCategory || [];
    setAvailableSubCategories(subs);

    if (formData.subCategoryName && !subs.includes(formData.subCategoryName)) {
      setFormData((prev) => ({ ...prev, subCategoryName: '' }));
    }
  }, [formData.category, localCategories, hasCategories]);

  /* ----------------------------------------------------------------- */
  /*  Helper change handlers                                            */
  /* ----------------------------------------------------------------- */
  const handleChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const addTag = () => {
    const t = newTag.trim();
    if (t && !formData.tags.includes(t)) {
      handleChange('tags', [...formData.tags, t]);
      setNewTag('');
    }
  };
  const removeTag = (i) =>
    handleChange(
      'tags',
      formData.tags.filter((_, idx) => idx !== i)
    );

  const addIngredient = () =>
    handleChange('ingredients', [
      ...(formData.ingredients || []),
      { ingredientId: '', ingredientName: '', quantity: '', unit: '' },
    ]);

  const updateIngredient = (idx, field, value) => {
    const copy = [...formData.ingredients];
    copy[idx][field] = value;
    if (field === 'ingredientId') {
      const ing = localIngredients.find((i) => i._id === value);
      if (ing) {
        copy[idx].ingredientName = ing.name;
        copy[idx].unit = ing.unit || '';
      }
    }
    handleChange('ingredients', copy);
  };
  const removeIngredient = (i) =>
    handleChange(
      'ingredients',
      formData.ingredients.filter((_, idx) => idx !== i)
    );

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      productImage: [...prev.productImage, ...files],
    }));

    e.target.value = '';
  };

  const removeImage = (i) => {
    setFormData((prev) => ({
      ...prev,
      productImage: prev.productImage.filter((_, idx) => idx !== i),
    }));
  };

  /* ----------------------------------------------------------------- */
  /*  Submit – builds FormData **exactly once**                         */
  /* ----------------------------------------------------------------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    const fd = new FormData();

    fd.append('productName', formData.productName || '');
    fd.append('description', formData.description || '');
    fd.append('tags', JSON.stringify(formData.tags || []));

    (formData.productImage || []).forEach((file) =>
      fd.append('productImage', file)
    );

    if (!formData.isAutoSKU && formData.SKU) fd.append('SKU', formData.SKU);

    if (hasCategories) {
      if (formData.category) fd.append('category', formData.category);
      if (formData.subCategoryName)
        fd.append('subCategoryName', formData.subCategoryName);
    }
    if (hasVendors && formData.vendor) fd.append('vendor', formData.vendor);

    industryFields.forEach((field) => {
      if (MANUAL_FIELDS.has(field.name)) return;

      const value = formData[field.name];
      if (value === undefined || value === null) return;

      if (
        Array.isArray(value) ||
        (typeof value === 'object' && value !== null)
      ) {
        fd.append(field.name, JSON.stringify(value));
      } else {
        fd.append(field.name, String(value));
      }
    });

    onSave(fd);
    onClose();
  };

  const isReadOnly = mode === 'view';

  /* ----------------------------------------------------------------- */
  /*  Create helpers                                                    */
  /* ----------------------------------------------------------------- */
  const saveNewCategoryToDb = async (payload) => {
    try {
      const created = await createCategory({
        categoryName: payload?.categoryName?.trim() || '',
        description: payload?.description || '',
        subCategory: Array.isArray(payload?.subCategory)
          ? payload.subCategory
          : [],
        tags: Array.isArray(payload?.tags) ? payload.tags : [],
      }).unwrap();

      setLocalCategories((prev) => {
        const exists = prev.some(
          (c) => (c._id || c.id) === (created._id || created.id)
        );
        return exists ? prev : [...prev, created];
      });

      handleChange('category', created._id || created.id);
      setIsCatModalOpen(false);
    } catch (err) {
      console.error('Create category failed:', err);
    }
  };

  const saveNewVendorToDb = async (payload) => {
    try {
      const created = await createVendor({
        name: payload?.name?.trim() || '',
        email: payload?.email || '',
        contactName: payload?.contactName || '',
        phone: payload?.phone || '',
        address: payload?.address || '',
        paymentType: payload?.paymentType || '',
      }).unwrap();

      setLocalVendors((prev) => {
        const id = created._id || created.id;
        return prev.some((v) => (v._id || v.id) === id)
          ? prev
          : [...prev, created];
      });

      handleChange('vendor', created._id || created.id);
      setIsVendorModalOpen(false);
    } catch (err) {
      console.error('Create vendor failed:', err);
    }
  };

  /* ----------------------------------------------------------------- */
  /*  Render helpers                                                    */
  /* ----------------------------------------------------------------- */
const renderField = (field) => {
  const placeholder = field.placeholder || ''; // <= central place

  if (field.name === 'SKU') {
    return (
      <div key="SKU" className="space-y-2">
        <Label>{field.label}</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={formData.SKU}
            onChange={(e) => handleChange('SKU', e.target.value.toUpperCase())}
            placeholder={
              formData.isAutoSKU
                ? 'Auto-generated'
                : placeholder || 'Enter custom SKU'
            }
            disabled={formData.isAutoSKU || isReadOnly}
            className="flex-1"
          />
          <Button
            type="button"
            variant={formData.isAutoSKU ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const newAuto = !formData.isAutoSKU;
              handleChange('isAutoSKU', newAuto);
              if (newAuto) handleChange('SKU', '');
            }}
            disabled={isReadOnly}
          >
            {formData.isAutoSKU ? 'Custom' : 'Auto'}
          </Button>
        </div>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div key={field.name} className="space-y-2">
        <Label>{field.label}</Label>
        <Input
          type="date"
          value={formData[field.name] || ''}
          onChange={(e) => handleChange(field.name, e.target.value)}
          disabled={isReadOnly}
        />
      </div>
    );
  }

  switch (field.type) {
    case 'number':
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            type="number"
            min={field.min}
            step={field.step || 1}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={isReadOnly}
            placeholder={placeholder}
          />
        </div>
      );

    case 'text':
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={isReadOnly}
            placeholder={placeholder}
          />
        </div>
      );

    case 'textarea':
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={isReadOnly}
            placeholder={placeholder}
          />
        </div>
      );

    case 'select':
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Select
            value={formData[field.name]}
            onValueChange={(v) => handleChange(field.name, v)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  placeholder ||
                  `Select ${String(field.label || '').toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'checkbox':
      return (
        <div key={field.name} className="flex items-center space-y-2">
          <input
            type="checkbox"
            checked={!!formData[field.name]}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            disabled={isReadOnly}
            className="mr-2"
          />
          <Label className="cursor-pointer">{field.label}</Label>
        </div>
      );

    default:
      return null;
  }
};


  /* ----------------------------------------------------------------- */
  /*  JSX                                                               */
  /* ----------------------------------------------------------------- */
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create'
                ? 'Add Product'
                : mode === 'edit'
                ? 'Edit Product'
                : 'View Product'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Fill in the details to create a new product.'
                : 'Update product information.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ==================== TWO-COLUMN SECTION ==================== */}

            <div>
              {/* ---- Images ---- */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">
                      Product images
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Upload clear photos of the product. First image will be
                      used as the main thumbnail.
                    </p>
                  </div>

                  {formData.imgUrl.length + formData.productImage.length >
                    0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {formData.imgUrl.length + formData.productImage.length}{' '}
                      image
                      {formData.imgUrl.length + formData.productImage.length > 1
                        ? 's'
                        : ''}
                    </span>
                  )}
                </div>

                {/* Preview gallery */}
                {(formData.imgUrl.length > 0 ||
                  formData.productImage.length > 0) && (
                  <div className="rounded-xl border bg-muted/40 p-3">
                    <div className="flex flex-wrap gap-3">
                      {formData.imgUrl.map((url, i) => (
                        <div
                          key={`existing-${i}`}
                          className="relative h-24 w-24 rounded-lg overflow-hidden border bg-background shadow-sm"
                        >
                          <img
                            src={url}
                            alt={`Existing ${i + 1}`}
                            className="h-full w-full object-cover cursor-pointer"
                            onClick={() =>
                              !isReadOnly &&
                              document.getElementById('image-upload').click()
                            }
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  imgUrl: prev.imgUrl.filter(
                                    (_, idx) => idx !== i
                                  ),
                                }))
                              }
                              className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 shadow"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      {formData.productImage.map((file, i) => (
                        <div
                          key={`new-${i}`}
                          className="relative h-24 w-24 rounded-lg overflow-hidden border bg-background shadow-sm"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${i + 1}`}
                            className="h-full w-full object-cover cursor-pointer"
                            onClick={() =>
                              !isReadOnly &&
                              document.getElementById('image-upload').click()
                            }
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 shadow"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload area */}
                {!isReadOnly && (
                  <>
                    <div
                      className="mt-1 border-2 border-dashed border-muted-foreground/40 rounded-xl px-4 py-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() =>
                        document.getElementById('image-upload').click()
                      }
                    >
                      <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Click to upload or drop files here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB per file
                      </p>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        Choose files
                      </Button>
                    </div>

                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ---- Product Name ---- */}
                <div className="space-y-2 ">
                  <Label>Name *</Label>
                  <Input
                    value={formData.productName}
                    onChange={(e) =>
                      handleChange('productName', e.target.value)
                    }
                    required
                    disabled={isReadOnly}
                    placeholder={'Enter Product Name'}
                  />
                </div>

                {/* ---- SKU (if defined) ---- */}
                {industryFields.some((f) => f.name === 'SKU') &&
                  renderField(industryFields.find((f) => f.name === 'SKU'))}

                {/* ---- Vendor (if enabled) ---- */}
                {hasVendors &&
                  industryFields.some((f) => f.type === 'select-vendor') && (
                    <div className="space-y-2 ">
                      <Label className="text-sm font-medium">Vendor</Label>

                      <Select
                        value={formData.vendor || undefined}
                        onValueChange={(val) => {
                          if (val === '__create_vendor__') {
                            // open vendor create modal, don't set value
                            setIsVendorModalOpen(true);
                            return;
                          }
                          handleChange('vendor', val);
                        }}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>

                        <SelectContent>
                          {localVendors.map((v) => (
                            <SelectItem key={v._id} value={v._id}>
                              {v.name}
                            </SelectItem>
                          ))}

                          {!isReadOnly && (
                            <>
                              <div className="my-1 border-t" />
                              <SelectItem
                                value="__create_vendor__"
                                className="text-primary font-medium cursor-pointer"
                              >
                                + Create new vendor
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* ---- Category (if enabled) ---- */}
                {hasCategories &&
                  industryFields.some((f) => f.type === 'select-category') && (
                    <div className="space-y-2 ">
                      <Label className="text-sm font-medium">Category *</Label>

                      <Select
                        value={formData.category || undefined}
                        onValueChange={(val) => {
                          if (val === '__create_category__') {
                            // open category create modal, skip storing this value
                            setIsCatModalOpen(true);
                            return;
                          }
                          handleChange('category', val);
                        }}
                        disabled={isReadOnly}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>

                        <SelectContent>
                          {localCategories.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.categoryName}
                            </SelectItem>
                          ))}

                          {!isReadOnly && (
                            <>
                              <div className="my-1 border-t" />
                              <SelectItem
                                value="__create_category__"
                                className="text-primary font-medium cursor-pointer"
                              >
                                + Create new category
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* ---- Sub-Category (if category selected) ---- */}
                {hasCategories && formData.category && (
                  <div className="space-y-2 -mt-1">
                    <Label className="text-sm font-medium">Sub Category</Label>
                    <Select
                      value={formData.subCategoryName}
                      onValueChange={(v) => handleChange('subCategoryName', v)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select sub-category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubCategories.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* ---- Dynamic Industry Fields ---- */}
                {dynamicFields.map(renderField)}
              </div>
            </div>
            {/* ==================== FULL-WIDTH INGREDIENTS ==================== */}
            {industryFields.some((f) => f.type === 'ingredients-array') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ingredients</Label>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsIngredientModalOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" /> New
                    </Button>
                  )}
                </div>

                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <Select
                      value={ing.ingredientId}
                      onValueChange={(v) =>
                        updateIngredient(idx, 'ingredientId', v)
                      }
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {localIngredients.map((i) => (
                          <SelectItem key={i._id} value={i._id}>
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="text"
                      value={ing.quantity}
                      onChange={(e) =>
                        updateIngredient(idx, 'quantity', e.target.value)
                      }
                      placeholder="Qty"
                      disabled={isReadOnly}
                      className="w-24"
                    />

                    <Input
                      type="text"
                      value={ing.unit || ''}
                      readOnly
                      disabled
                      className="w-28 bg-muted text-muted-foreground"
                    />

                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(idx)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Ingredient
                  </Button>
                )}
              </div>
            )}

            {/* ==================== TAGS (FULL-WIDTH) ==================== */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  disabled={isReadOnly}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addTag())
                  }
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={isReadOnly || !newTag.trim()}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((t, i) => (
                  <Badge key={i} className="flex items-center gap-1">
                    {t}
                    {!isReadOnly && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(i)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* ==================== DESCRIPTION (FULL-WIDTH) ==================== */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                // required
                disabled={isReadOnly}
                className="min-h-32"
                placeholder="Enter description of the product"
              />
            </div>

            {/* ==================== FOOTER ==================== */}
            <DialogFooter className="gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isReadOnly && (
                <Button type="submit">
                  {mode === 'create' ? 'Create Product' : 'Save Changes'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== MODALS ==================== */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        mode="create"
        category={null}
        onSave={saveNewCategoryToDb}
        loading={false}
      />

      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        mode="create"
        vendor={null}
        onSave={saveNewVendorToDb}
      />

      <IngredientModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        mode="create"
        ingredient={null}
        industry={industry}
        onSave={async (payload) => {
          try {
            const created = await createIngredient(payload).unwrap();
            setLocalIngredients((prev) => {
              const exists = prev.some((i) => i._id === created._id);
              return exists ? prev : [...prev, created];
            });
            setIsIngredientModalOpen(false);
          } catch (err) {
            console.error('Failed to create ingredient:', err);
          }
        }}
      />
    </>
  );
});
