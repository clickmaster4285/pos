'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  'Engine Parts',
  'Transmission',
  'Suspension',
  'Brakes',
  'Electrical',
  'Body Parts',
  'Interior',
  'Accessories',
];

export default function WarehouseForm({ item, onSave, onClose }) {
  const [formData, setFormData] = useState({
    partNumber: '',
    partName: '',
    category: '',
    location: '',
    quantity: 0,
    unitPrice: 0,
    supplier: '',
    lastRestocked: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (item) {
      setFormData({
        partNumber: item.partNumber,
        partName: item.partName,
        category: item.category,
        location: item.location,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        supplier: item.supplier,
        lastRestocked: item.lastRestocked,
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'quantity' || name === 'unitPrice'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg  border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-foreground">
            {item ? 'Edit Part' : 'Add New Part'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Part Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Part Number *
              </label>
              <Input
                type="text"
                name="partNumber"
                value={formData.partNumber}
                onChange={handleChange}
                placeholder="e.g., AP-2024-001"
                required
                className=" border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Part Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Part Name *
              </label>
              <Input
                type="text"
                name="partName"
                value={formData.partName}
                onChange={handleChange}
                placeholder="e.g., Alternator"
                required
                className=" border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full rounded-md  border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location *
              </label>
              <Input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Shelf A-12"
                required
                className=" border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quantity *
              </label>
              <Input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                required
                min="0"
                className=" border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Unit Price ($) *
              </label>
              <Input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="0.00"
                required
                min="0"
                step="0.01"
                className=" border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Supplier */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Supplier
              </label>
              <Input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., AutoParts Inc."
                className=" border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Last Restocked */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Restocked
              </label>
              <Input
                type="date"
                name="lastRestocked"
                value={formData.lastRestocked}
                onChange={handleChange}
                className=" border-border text-foreground"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end border-border pt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-border text-foreground hover: bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {item ? 'Update Part' : 'Add Part'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
