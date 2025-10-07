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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Star } from 'lucide-react';

const categories = [
  'Engine Parts',
  'Brake Systems',
  'Electrical',
  'Transmission',
  'Suspension',
];
const statuses = ['Active', 'Inactive', 'Pending'];
const paymentTypes = ['Cash', 'EasyPaisa', 'Bank', 'Other'];

export function VendorModal({ isOpen, onClose, onSave, vendor, mode }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active',
    category: '',
    rating: 5,
    notes: '',
    paymentType: '',
  });

  useEffect(() => {
    if (vendor) {
      setFormData({ ...vendor, notes: vendor.notes || '', paymentType: vendor.paymentType || '' });
    } else {
      setFormData({
        id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'Active',
        category: '',
        rating: 5,
        notes: '',
        paymentType: '',
      });
    }
  }, [vendor, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Inactive':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            {mode === 'create' && 'Add New Vendor'}
            {mode === 'edit' && 'Edit Vendor'}
            {mode === 'view' && 'Vendor Details'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mb-3">
            {mode === 'create' &&
              'Create a new vendor profile for your automotive business.'}
            {mode === 'edit' && 'Update vendor information and settings.'}
            {mode === 'view' && 'View complete vendor profile and details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Vendor Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter vendor name"
                required
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-foreground">
                Contact Name *
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="Enter contact name"
                required
                disabled={isReadOnly}
                className="border-border focus:ring"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="vendor@example.com"
                required
                disabled={isReadOnly}
                className="border-border focus:ring-ring"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isReadOnly}
                className="border-border focus:ring-ring"
              />
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label htmlFor="paymentType" className="text-foreground">
                Payment Type
              </Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) => handleChange('paymentType', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger id="paymentType" className="border-border focus:ring-ring">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-foreground">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Business St, City, State, ZIP"
              disabled={isReadOnly}
              className="border-border focus:ring-ring"
            />
          </div>

          {/* Vendor ID (display only for existing vendors) */}
          {formData.id && (
            <div className="space-y-2">
              <Label className="text-foreground">Vendor ID</Label>
              <Input
                value={formData.id}
                disabled
                className="border-border bg-muted"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" className="gap-2">
                {mode === 'create' ? 'Create Vendor' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}