// src/components/company/CreateCompanyForm.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateCompanyMutation } from '@/features/superAdminApi';
import { Industries } from '@/utils/industryFields';
import { useGetAllPlansQuery } from '@/features/planApi';

export function CreateCompanyForm({ open, onOpenChange, onSuccess }) {
  const [createCompany, { isLoading }] = useCreateCompanyMutation();
  const {
    data: plans = [],
    isLoading: isPlansLoading,
    error: plansError,
  } = useGetAllPlansQuery();

  // -----------------------------------------------------------------
  // Form state
  // -----------------------------------------------------------------
  const [formData, setFormData] = useState({
    // ----- company -----
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    plan: '',
    industryName: '',
    // ----- admin -----
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminAddress: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  // -----------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    // ----- company -----
    if (!formData.companyName?.trim())
      newErrors.companyName = 'Company name must be at least 2 characters';

    if (!formData.industryName?.trim())
      newErrors.industryName = 'Please select an industry';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.contactEmail || !emailRegex.test(formData.contactEmail))
      newErrors.contactEmail = 'Invalid company email';

    if (!formData.address?.trim())
      newErrors.address = 'Address must be at least 5 characters';

    if (!formData.plan?.trim())
      newErrors.plan = 'Please select a plan';

    // ----- admin -----
    if (!formData.adminName?.trim())
      newErrors.adminName = 'Owner name is required';

    if (!formData.adminEmail || !emailRegex.test(formData.adminEmail))
      newErrors.adminEmail = 'Invalid owner email';


    if (!formData.adminAddress?.trim())
      newErrors.adminAddress = 'Owner address must be at least 5 characters';

    if (!formData.password)
      newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      company: {
        name: formData.companyName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        address: formData.address.trim(),
        plan: formData.plan.trim(),
        industryName: formData.industryName.trim(),
      },
      admin: {
        name: formData.adminName.trim(),
        email: formData.adminEmail.trim(),
        phone: formData.adminPhone.trim(),
        address: formData.adminAddress.trim(),
        password: formData.password,
      },
    };

    try {
      await createCompany(payload).unwrap();

      // Reset form
      setFormData({
        companyName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        plan: '',
        industryName: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        adminAddress: '',
        password: '',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create company:', error);
    }
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ==================== COMPANY SECTION ==================== */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-lg font-semibold">Company Details</h3>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <Input
                name="companyName"
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Industry
              </label>
              <select
                name="industryName"
                value={formData.industryName}
                onChange={handleChange}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select an industry</option>
                {Industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {errors.industryName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.industryName}
                </p>
              )}
            </div>

            {/* Contact Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Email
                </label>
                <Input
                  name="contactEmail"
                  type="email"
                  placeholder="admin@acme.com"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.contactEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Phone
                </label>
                <Input
                  name="contactPhone"
                  placeholder="+1234567890"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.contactPhone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.contactPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Address
              </label>
              <Textarea
                name="address"
                placeholder="123 Business St, Suite 100, City, Country"
                className="resize-none"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">
                  {errors.address}
                </p>
              )}
            </div>

            {/* ==== PLAN SELECT ==== */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Plan
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                disabled={isLoading || isPlansLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {isPlansLoading ? 'Loading plans...' : 'Select a plan'}
                </option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}{' '}
                    ({plan.price === 0 ? 'Free' : `$${plan.price}`}) –{' '}
                    {plan.validateDays} days
                  </option>
                ))}
              </select>
              {errors.plan && (
                <p className="text-sm text-destructive mt-1">
                  {errors.plan}
                </p>
              )}
              {plansError && (
                <p className="text-sm text-destructive mt-1">
                  Failed to load plans.
                </p>
              )}
            </div>
          </div>

          {/* ==================== ADMIN SECTION ==================== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Company Owner (Admin)
            </h3>

            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Owner Name
              </label>
              <Input
                name="adminName"
                placeholder="John Doe"
                value={formData.adminName}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.adminName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.adminName}
                </p>
              )}
            </div>

            {/* Owner Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Owner Email
                </label>
                <Input
                  name="adminEmail"
                  type="email"
                  placeholder="owner@acme.com"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.adminEmail && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.adminEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Owner Phone
                </label>
                <Input
                  name="adminPhone"
                  placeholder="+1234567890"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.adminPhone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.adminPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Owner Address */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Owner Address
              </label>
              <Textarea
                name="adminAddress"
                placeholder="123 Home St, City, Country"
                className="resize-none"
                rows={2}
                value={formData.adminAddress}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.adminAddress && (
                <p className="text-sm text-destructive mt-1">
                  {errors.adminAddress}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                name="password"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* ==================== FOOTER ==================== */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}   