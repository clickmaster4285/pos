'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tag, X, PlusCircle } from 'lucide-react';

export function ProductModal({ isOpen, onClose, onSave, product, mode, categories, vendors }) {
  const [formData, setFormData] = useState({
    id: '',
    productName: '',
    categoryName: '',
    subCategory: '',
    vendor: '',
    SKU: '',
    sellingPrice: '',
    costPrice: '',
    quantity: '',
    location: '',
    condition: '',
    attribute: [], // Changed to array of objects
    customAttributes: [],
    description: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [isAutoSKU, setIsAutoSKU] = useState(true);
  const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });
  const [newCustomAttribute, setNewCustomAttribute] = useState({ key: '', value: '' });

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        productName: product.productName,
        categoryName: product.categoryName,
        subCategory: product.subCategory,
        vendor: product.vendor,
        SKU: product.SKU,
        sellingPrice: product.sellingPrice.toString(),
        costPrice: product.costPrice.toString(),
        quantity: product.quantity.toString(),
        location: product.location,
        condition: product.condition,
        attribute: Array.isArray(product.attribute) ? product.attribute : [],
        customAttributes: Array.isArray(product.customAttributes) ? product.customAttributes : [],
        description: product.description,
        tags: product.tags || [],
      });
      setIsAutoSKU(!product.SKU);
    } else {
      setFormData({
        id: '',
        productName: '',
        categoryName: '',
        subCategory: '',
        vendor: '',
        SKU: '',
        sellingPrice: '',
        costPrice: '',
        quantity: '',
        location: '',
        condition: '',
        attribute: [],
        customAttributes: [],
        description: '',
        tags: [],
      });
      setIsAutoSKU(true);
    }
    setNewTag('');
    setNewAttribute({ key: '', value: '' });
    setNewCustomAttribute({ key: '', value: '' });
  }, [product, isOpen]);

  useEffect(() => {
    if (formData.categoryName) {
      const selectedCategory = categories.find((c) => c.categoryName === formData.categoryName);
      setAvailableSubCategories(selectedCategory?.subCategory || []);
      if (!selectedCategory || !selectedCategory.subCategory.includes(formData.subCategory)) {
        setFormData((prev) => ({ ...prev, subCategory: '' }));
      }
    } else {
      setAvailableSubCategories([]);
      setFormData((prev) => ({ ...prev, subCategory: '' }));
    }
  }, [formData.categoryName, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      SKU: isAutoSKU ? '' : formData.SKU,
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (key, value) => {
    setNewAttribute((prev) => ({ ...prev, [key]: value }));
  };

  const addAttribute = () => {
    if (newAttribute.key.trim() && newAttribute.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        attribute: [...prev.attribute, newAttribute],
      }));
      setNewAttribute({ key: '', value: '' });
    }
  };

  const removeAttribute = (index) => {
    setFormData((prev) => ({
      ...prev,
      attribute: prev.attribute.filter((_, i) => i !== index),
    }));
  };

  const handleCustomAttributeChange = (key, value) => {
    setNewCustomAttribute((prev) => ({ ...prev, [key]: value }));
  };

  const addCustomAttribute = () => {
    if (newCustomAttribute.key.trim() && newCustomAttribute.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        customAttributes: [...prev.customAttributes, newCustomAttribute],
      }));
      setNewCustomAttribute({ key: '', value: '' });
    }
  };

  const removeCustomAttribute = (index) => {
    setFormData((prev) => ({
      ...prev,
      customAttributes: prev.customAttributes.filter((_, i) => i !== index),
    }));
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

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {mode === 'create' && 'Add New Product'}
            {mode === 'edit' && 'Edit Product'}
            {mode === 'view' && 'Product Details'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mb-3">
            {mode === 'create' && 'Create a new product for inventory.'}
            {mode === 'edit' && 'Update product information and settings.'}
            {mode === 'view' && 'View complete product profile and details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-foreground">Product Name *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => handleChange('productName', e.target.value)}
                placeholder="Enter product name"
                required
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-foreground">Category *</Label>
              <Select
                value={formData.categoryName}
                onValueChange={(value) => handleChange('categoryName', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c.categoryName}>{c.categoryName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subCategory" className="text-foreground">Subcategory</Label>
              <Select
                value={formData.subCategory}
                onValueChange={(value) => handleChange('subCategory', value)}
                disabled={isReadOnly || !formData.categoryName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubCategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor" className="text-foreground">Vendor *</Label>
              <Select
                value={formData.vendor}
                onValueChange={(value) => handleChange('vendor', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v._id} value={v._id}>{v.name || v._id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">SKU</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isAutoSKU ? 'default' : 'outline'}
                  onClick={() => setIsAutoSKU(true)}
                  disabled={isReadOnly}
                  className="gap-2"
                >
                  Auto SKU
                </Button>
                <Button
                  type="button"
                  variant={!isAutoSKU ? 'default' : 'outline'}
                  onClick={() => setIsAutoSKU(false)}
                  disabled={isReadOnly}
                  className="gap-2"
                >
                  Custom SKU
                </Button>
              </div>
              {!isAutoSKU && (
                <Input
                  id="SKU"
                  value={formData.SKU}
                  onChange={(e) => handleChange('SKU', e.target.value)}
                  placeholder="Enter custom SKU"
                  disabled={isReadOnly}
                  className="border-border focus:ring mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice" className="text-foreground">Cost Price</Label>
              <Input
                id="costPrice"
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleChange('costPrice', e.target.value)}
                placeholder="Enter cost price"
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-foreground">Selling Price *</Label>
              <Input
                id="sellingPrice"
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => handleChange('sellingPrice', e.target.value)}
                placeholder="Enter selling price"
                required
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-foreground">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="Enter quantity"
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Enter location"
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition" className="text-foreground">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleChange('condition', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Attributes</Label>
            <div className="flex gap-2">
              <Input
                value={newAttribute.key}
                onChange={(e) => handleAttributeChange('key', e.target.value)}
                placeholder="Attribute name"
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
              <Input
                value={newAttribute.value}
                onChange={(e) => handleAttributeChange('value', e.target.value)}
                placeholder="Attribute value"
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
              <Button
                type="button"
                onClick={addAttribute}
                disabled={isReadOnly || !newAttribute.key.trim() || !newAttribute.value.trim()}
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.attribute.map((attr, index) => (
                <Badge key={index} className="flex items-center gap-1">
                  {attr.key}: {attr.value}
                  {!isReadOnly && (
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeAttribute(index)} />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Custom Attributes</Label>
            <div className="flex gap-2">
              <Input
                value={newCustomAttribute.key}
                onChange={(e) => handleCustomAttributeChange('key', e.target.value)}
                placeholder="Attribute name"
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
              <Input
                value={newCustomAttribute.value}
                onChange={(e) => handleCustomAttributeChange('value', e.target.value)}
                placeholder="Attribute value"
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
              <Button
                type="button"
                onClick={addCustomAttribute}
                disabled={isReadOnly || !newCustomAttribute.key.trim() || !newCustomAttribute.value.trim()}
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.customAttributes.map((attr, index) => (
                <Badge key={index} className="flex items-center gap-1">
                  {attr.key}: {attr.value}
                  {!isReadOnly && (
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeCustomAttribute(index)} />
                  )}
                </Badge>
              ))}
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
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(index)} />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
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
  );
}