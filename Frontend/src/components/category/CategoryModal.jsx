'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tag, X } from 'lucide-react';

export function CategoryModal({ isOpen, onClose, onSave, category, mode }) {
  const [formData, setFormData] = useState({
    id: '',
    categoryName: '',
    description: '',
    subCategory: [],
    tags: [],
  });
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id,
        categoryName: category.categoryName,
        description: category.description,
        subCategory: Array.isArray(category.subCategory) ? category.subCategory : [],
        tags: Array.isArray(category.tags) ? category.tags : [],
      });
    } else {
      setFormData({
        id: '',
        categoryName: '',
        description: '',
        subCategory: [],
        tags: [],
      });
    }
    setNewSubCategory('');
    setNewTag('');
  }, [category, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSubCategory = () => {
    if (newSubCategory.trim()) {
      setFormData((prev) => ({
        ...prev,
        subCategory: [...prev.subCategory, newSubCategory.trim()],
      }));
      setNewSubCategory('');
    }
  };

  const removeSubCategory = (index) => {
    setFormData((prev) => ({
      ...prev,
      subCategory: prev.subCategory.filter((_, i) => i !== index),
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
      <DialogContent className="max-w-2xl border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {mode === 'create' && 'Add New Category'}
            {mode === 'edit' && 'Edit Category'}
            {mode === 'view' && 'Category Details'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mb-3">
            {mode === 'create' &&
              'Create a new category for automotive parts.'}
            {mode === 'edit' && 'Update category information and settings.'}
            {mode === 'view' && 'View complete category profile and details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-foreground">
                Category Name *
              </Label>
              <Input
                id="categoryName"
                value={formData.categoryName}
                onChange={(e) => handleChange('categoryName', e.target.value)}
                placeholder="Enter category name"
                required
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            {/* Sub Categories */}
            <div className="space-y-2">
              <Label className="text-foreground">Sub Categories</Label>
              <div className="flex gap-2">
                <Input
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  placeholder="Enter sub category"
                  disabled={isReadOnly}
                  className="border-border focus:ring"
                />
                <Button
                  type="button"
                  onClick={addSubCategory}
                  disabled={isReadOnly || !newSubCategory.trim()}
                  className="gap-2"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subCategory.map((sub, index) => (
                  <Badge
                    key={index}
                    className="flex items-center gap-1"
                  >
                    {sub}
                    {!isReadOnly && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSubCategory(index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
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
                  <Badge
                    key={index}
                    className="flex items-center gap-1"
                  >
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter category description"
              disabled={isReadOnly}
              className="border-border focus:ring-ring"
            />
          </div>

          {/* Category ID (display only for existing categories) */}
          {/* {formData.id && (
            <div className="space-y-2">
              <Label className="text-foreground">Category ID</Label>
              <Input
                value={formData.id}
                disabled
                className="border-border bg-muted"
              />
            </div>
          )} */}

          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" className="gap-2">
                {mode === 'create' ? 'Create Category' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}