'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
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
import { Tag, X, PlusCircle } from 'lucide-react';

const CategoryModal = dynamic(
  () => import('@/components/category/CategoryModal').then((m) => m.default ?? m.CategoryModal),
  { ssr: false }
);

import { VendorModal } from '@/components/vendors/vendor-modal';
import { useSelector } from 'react-redux';
import { useCreateCategoryMutation } from '@/features/categoryApi';
import { useCreateVendorMutation } from '@/features/vendorApi';

const hasVendorsFeature = () => {
  const user = useSelector((state) => state.auth.user);
  if (user) {
    const parsedAuthState = user;
    return parsedAuthState.extraFeature?.includes('Vendors') || false;
  }
  return false;
};

const hasCategoriesFeature = () => {
  const user = useSelector((state) => state.auth.user);
  if (user) {
    const parsedAuthState = user;
    return parsedAuthState.extraFeature?.includes('Category') || false;
  }
  return false;
};

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  mode,
  categories,
  vendors,
  ingredients = [],
}) {
  const [formData, setFormData] = useState({
    id: '',
    productName: '',
    category: '',
    subCategoryName: '',
    vendor: '',
    SKU: '',
    sellingPrice: '',
    costPrice: '',
    quantity: '',
    description: '',
    tags: [],
    ingredient: [],
  });
  const [newTag, setNewTag] = useState('');
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [isAutoSKU, setIsAutoSKU] = useState(true);

  const [localCategories, setLocalCategories] = useState(categories);
  const [localVendors, setLocalVendors] = useState(vendors);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  const [createCategory, { isLoading: creatingCat }] = useCreateCategoryMutation();
  const [createVendor, { isLoading: creatingVen }] = useCreateVendorMutation();

  useEffect(() => setLocalCategories(categories), [categories]);
  useEffect(() => setLocalVendors(vendors), [vendors]);

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        productName: product.productName,
        category: product.category?._id || product.category || '',
        subCategoryName: product.subCategoryName || '',
        vendor: product.vendor?._id || product.vendor || '',
        SKU: product.SKU,
        sellingPrice: product.sellingPrice.toString(),
        costPrice: product.costPrice.toString(),
        quantity: product.quantity.toString(),
        description: product.description,
        tags: product.tags || [],
        ingredient: product.ingredientNames?.map(i => i._id) || product.ingredient || [],
      });
      setIsAutoSKU(!product.SKU);
    } else {
      setFormData({
        id: '',
        productName: '',
        category: '',
        subCategoryName: '',
        vendor: '',
        SKU: '',
        sellingPrice: '',
        costPrice: '',
        quantity: '',
        description: '',
        tags: [],
        ingredient: [],
      });
      setIsAutoSKU(true);
    }
    setNewTag('');
  }, [product, isOpen]);

  useEffect(() => {
    if (formData.category) {
      const selected = localCategories.find((c) => c._id === formData.category);
      const subs = selected?.subCategory || [];
      setAvailableSubCategories(subs);
      if (!subs.includes(formData.subCategoryName)) {
        setFormData((prev) => ({ ...prev, subCategoryName: '' }));
      }
    } else {
      setAvailableSubCategories([]);
    }
  }, [formData.category, localCategories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      SKU: isAutoSKU ? '' : formData.SKU,
      ingredient: formData.ingredient,
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const saveNewCategoryToDb = async (newCat) => {
    try {
      const created = await createCategory(newCat).unwrap();
      setLocalCategories((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, category: created._id }));
      setIsCatModalOpen(false);
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const saveNewVendorToDb = async (newVen) => {
    try {
      const created = await createVendor(newVen).unwrap();
      setLocalVendors((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, vendor: created._id }));
      setIsVendorModalOpen(false);
    } catch (err) {
      console.error('Failed to create vendor:', err);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {mode === 'create' ? 'Add Product' : mode === 'edit' ? 'Edit Product' : 'Product Details'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {mode === 'create' ? 'Create a new product' : 'Update product information'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Product Name *</Label>
                <Input
                  value={formData.productName}
                  onChange={(e) => handleChange('productName', e.target.value)}
                  placeholder="Enter product name"
                  disabled={isReadOnly}
                  className="border-border focus:ring"
                />
              </div>

              {hasCategoriesFeature() && (
                <div className="space-y-2">
                  <Label className="text-foreground">Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.category}
                      onValueChange={(val) => handleChange('category', val)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {localCategories.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.categoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCatModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {hasCategoriesFeature() && formData.category && (
                <div className="space-y-2">
                  <Label className="text-foreground">Subcategory</Label>
                  <Select
                    value={formData.subCategoryName}
                    onValueChange={(val) => handleChange('subCategoryName', val)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubCategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {hasVendorsFeature() && (
                <div className="space-y-2">
                  <Label className="text-foreground">Vendor</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.vendor}
                      onValueChange={(val) => handleChange('vendor', val)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {localVendors.map((v) => (
                          <SelectItem key={v._id} value={v._id}>
                            {v.vendorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsVendorModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-foreground">SKU</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.SKU}
                    onChange={(e) => handleChange('SKU', e.target.value.toUpperCase())}
                    placeholder="Enter SKU"
                    disabled={isReadOnly || isAutoSKU}
                    className="border-border focus:ring"
                  />
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAutoSKU(!isAutoSKU)}
                    >
                      {isAutoSKU ? 'Manual' : 'Auto'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Selling Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => handleChange('sellingPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  disabled={isReadOnly}
                  className="border-border focus:ring"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Cost Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => handleChange('costPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  disabled={isReadOnly}
                  className="border-border focus:ring"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Initial Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="0"
                  min="0"
                  disabled={isReadOnly}
                  className="border-border focus:ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Ingredients</Label>
              <Select
                value=""
                onValueChange={(val) => {
                  if (!formData.ingredient.includes(val)) {
                    handleChange('ingredient', [...formData.ingredient, val]);
                  }
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing._id} value={ing._id}>
                      {ing.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.ingredient.map((id, idx) => {
                  const ing = ingredients.find(i => i._id === id);
                  return (
                    <Badge key={idx} className="flex items-center gap-1">
                      {ing?.name || 'Unknown'}
                      {!isReadOnly && (
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleChange('ingredient', formData.ingredient.filter((_, i) => i !== idx))}
                        />
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag"
                  disabled={isReadOnly}
                  className="border-border focus:ring"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={isReadOnly || !newTag.trim()}
                  className="gap-2"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} className="flex items-center gap-1">
                    {tag}
                    {!isReadOnly && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter product description"
                disabled={isReadOnly}
                className="border-border focus:ring-ring"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isReadOnly && (
                <Button type="submit" className="gap-2">
                  {mode === 'create' ? 'Create Product' : 'Save Changes'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        mode="create"
        category={null}
        onSave={saveNewCategoryToDb}
        loading={creatingCat}
      />

      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSave={saveNewVendorToDb}
        mode="create"
        vendor={null}
      />
    </>
  );
}