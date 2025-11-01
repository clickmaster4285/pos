// src/components/company/CompanyDetailsSheet.jsx
'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Users,
  Building,
  Tag,
  Pencil,
  Trash2,
  CheckCircle,
} from 'lucide-react';

function initials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function prettyDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatCurrency(amount, code = 'PKR') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code || 'PKR',
  }).format(amount);
}

export function CompanyDetailsSheet({
  open,
  onOpenChange,
  company,
  onEdit,
  onDelete,
  onToggle,
  pending = false,
}) {
  if (!company) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Company</SheetTitle>
            <SheetDescription>Loading…</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const isActive = !!company.isActive;
  const owner = company.ownerDetails || {};
  const plan = Array.isArray(company.plan) ? company.plan[0] : null;
  const subscription = Array.isArray(company.subscription)
    ? company.subscription[0]
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="md:max-w-lg p-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/20 dark:to-teal-950/20 p-6">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border shadow-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {initials(company.name)}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-gray-900 dark:text-white">
                    {company.name || 'Unnamed Company'}
                  </SheetTitle>
                  <SheetDescription className="truncate text-gray-600 dark:text-gray-300">
                    {company.industryName || '—'}
                  </SheetDescription>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`px-2 py-1 text-xs font-medium ${isActive ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>

              {plan && (
                <Badge variant="outline" className="text-xs">
                  {plan.name} Plan
                </Badge>
              )}
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div className="text-sm font-medium">{company.address || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5">
                  <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium">{company.contactEmail || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm font-medium">{company.contactPhone || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Owner</div>
                  <div className="text-sm font-medium">{owner.name || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Staff</div>
                  <div className="text-sm font-medium">
                    {Array.isArray(company.gain?.staff) ? company.gain.staff.length : '0'}
                  </div>
                </div>
              </div>

              {plan && (
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">Plan Price</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(plan.price, company.invoiceSettings?.currency?.code)}
                    </div>
                  </div>
                </div>
              )}

              {subscription && (
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">Subscription</div>
                    <div className="text-sm font-medium capitalize">
                      {subscription.status}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Settings */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" /> Invoice Settings
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Currency</div>
                  <div className="font-medium">
                    {company.invoiceSettings?.currency?.code || '—'} (
                    {company.invoiceSettings?.currency?.symbol || '—'})
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Prefix</div>
                  <div className="font-medium">{company.invoiceSettings?.format?.prefix || '—'}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Start Number</div>
                  <div className="font-medium">{company.invoiceSettings?.format?.startNumber ?? '—'}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Tax Registered</div>
                  <div className="font-medium">
                    {company.invoiceSettings?.tax?.isTaxPayerRegistered ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" /> Timeline
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created</span>
                  </div>
                  <div className="text-sm font-medium">{prettyDate(company.createdAt)}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated</span>
                  </div>
                  <div className="text-sm font-medium">{prettyDate(company.updatedAt)}</div>
                </div>

                {owner.lastLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Owner Last Login</span>
                    </div>
                    <div className="text-sm font-medium">{prettyDate(owner.lastLogin)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => onEdit(company)}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => onDelete(company)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onToggle && (
                <Button
                  type="button"
                  variant={isActive ? 'secondary' : 'default'}
                  className="gap-2 flex-1 min-w-[120px]"
                  onClick={() => onToggle(company)}
                  disabled={pending}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              <SheetClose asChild>
                <Button type="button" variant="outline" className="gap-2">
                  Close
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}