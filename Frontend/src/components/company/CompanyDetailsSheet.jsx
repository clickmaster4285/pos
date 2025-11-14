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
import { Separator } from '@/components/ui/separator';
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
  User,
  Shield,
  CreditCard,
  FileText,
  Printer,
  Globe,
  Smartphone,
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

function StatusBadge({ status, isActive }) {
  const statusConfig = {
    Active: { variant: 'default', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    Inactive: { variant: 'secondary', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
    Pending: { variant: 'outline', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  };

  const config = statusConfig[status] || statusConfig.Inactive;

  return (
    <Badge variant={config.variant} className={`px-2 py-1 text-xs font-medium ${config.class}`}>
      <div className={`w-2 h-2 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      {status}
    </Badge>
  );
}

function DetailRow({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg mt-0.5 flex-shrink-0">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-medium">{value || '—'}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
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
  const subscription = Array.isArray(company.subscription) ? company.subscription[0] : null;
  const invoiceSettings = company.invoiceSettings || {};
  const staffCount = Array.isArray(company.gain?.staff) ? company.gain.staff.length : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="md:max-w-xl lg:max-w-2xl p-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-100 dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-teal-950/20 p-6 border-b">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border shadow-sm font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                  {initials(company.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {company.name || 'Unnamed Company'}
                  </SheetTitle>
                  <SheetDescription className="text-gray-600 dark:text-gray-300 truncate">
                    {company.contactEmail || '—'}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={company.status} isActive={isActive} />
                {plan && (
                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30">
                    {plan.name} Plan
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Building className="h-3 w-3 mr-1" />
                {company.industry || '—'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {staffCount} Staff
              </Badge>
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                {company.usersCount || 0} Users
              </Badge>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Company Information */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={Building} title="Company Information" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow icon={MapPin} label="Address" value={company.address} />
                <DetailRow icon={Mail} label="Email" value={company.contactEmail} />
                <DetailRow icon={Phone} label="Phone" value={company.contactPhone} />
                <DetailRow icon={Users} label="Industry" value={company.industry} />
              </div>
            </CardContent>
          </Card>

          {/* Admin Details */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={Shield} title="Administrator Details" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow icon={User} label="Full Name" value={owner.name} />
                <DetailRow icon={Mail} label="Email" value={owner.email} />
                <DetailRow icon={MapPin} label="Address" value={owner.address} />
                <DetailRow icon={Shield} label="Role" value={owner.role} />
                <DetailRow icon={CheckCircle} label="Verification" value={owner.verified ? 'Verified' : 'Not Verified'} />
                <DetailRow icon={Smartphone} label="MFA" value={owner.mfaEnabled ? 'Enabled' : 'Disabled'} />
              </div>

              {/* Admin Permissions */}
              {owner.permissions && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Permissions</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(owner.permissions).map(([key, value]) => 
                      value && (
                        <Badge key={key} variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription & Billing */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={CreditCard} title="Subscription & Billing" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan && (
                  <>
                    <DetailRow icon={Tag} label="Plan Name" value={plan.name} />
                    <DetailRow 
                      icon={DollarSign} 
                      label="Plan Price" 
                      value={formatCurrency(plan.price, invoiceSettings?.currency?.code)} 
                    />
                  </>
                )}
                {subscription && (
                  <DetailRow 
                    icon={CheckCircle} 
                    label="Subscription Status" 
                    value={subscription.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : '—'} 
                  />
                )}
                <DetailRow icon={Calendar} label="Staff Count" value={staffCount.toString()} />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Settings */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={FileText} title="Invoice Settings" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow 
                  icon={Globe} 
                  label="Currency" 
                  value={invoiceSettings.currency ? `${invoiceSettings.currency.code} (${invoiceSettings.currency.symbol})` : '—'} 
                />
                <DetailRow icon={Tag} label="Invoice Prefix" value={invoiceSettings.format?.prefix} />
                <DetailRow icon={FileText} label="Start Number" value={invoiceSettings.format?.startNumber?.toString()} />
                <DetailRow 
                  icon={CheckCircle} 
                  label="Tax Registered" 
                  value={invoiceSettings.tax?.isTaxPayerRegistered ? 'Yes' : 'No'} 
                />
                {invoiceSettings.template && (
                  <DetailRow icon={Printer} label="Template" value={invoiceSettings.template.type} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Activity */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={Clock} title="Timeline & Activity" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Company Created</span>
                  </div>
                  <div className="text-sm font-medium">{prettyDate(company.createdAt)}</div>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Updated</span>
                  </div>
                  <div className="text-sm font-medium">{prettyDate(company.updatedAt)}</div>
                </div>

                <Separator />

                {owner.lastLogin && (
                  <>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Owner Last Login</span>
                      </div>
                      <div className="text-sm font-medium">{prettyDate(owner.lastLogin)}</div>
                    </div>
                    
                    <Separator />
                  </>
                )}

                {owner.status && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Admin Status</span>
                    </div>
                    <div className="text-sm font-medium">
                      {owner.status.isaccepted === 'true' ? 'Accepted' : 'Pending'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 dark:bg-gray-900/50 p-6 sticky bottom-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/20"
                  onClick={() => onEdit(company)}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1 text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
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
                  variant={isActive ? "outline" : "default"}
                  className={`gap-2 flex-1 min-w-[120px] ${
                    isActive 
                      ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  onClick={() => onToggle(company)}
                  disabled={pending}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              <SheetClose asChild>
                <Button type="button" variant="outline" className="gap-2 border-gray-200 dark:border-gray-700">
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