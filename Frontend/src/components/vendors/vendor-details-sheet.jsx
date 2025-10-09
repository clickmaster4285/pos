'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Copy,
  Check,
  Pencil,
  Trash2,
  BadgeCheck,
  Building,
  User,
  MoreVertical,
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

function prettyDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString();
}

function prettyDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString();
}

export function VendorDetailsSheet({
  open,
  onOpenChange,
  vendor,
  onEdit,
  onDelete,
  onToggle,
  pending = false,
}) {
  const [copied, setCopied] = React.useState(null);

  const copy = async (label, value) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  };

  if (!vendor) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Vendor</SheetTitle>
            <SheetDescription>Loading…</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const isActive = !!vendor.isActive;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="md:max-w-lg p-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 p-6">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border shadow-sm font-semibold text-blue-700 dark:text-blue-300">
                  {initials(vendor.name || vendor.contactName)}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-gray-900 dark:text-white">
                    {vendor.name || 'Vendor'}
                  </SheetTitle>
                  <SheetDescription className="truncate text-gray-600 dark:text-gray-300">
                    {vendor.contactName
                      ? `Contact: ${vendor.contactName}`
                      : 'Vendor details'}
                  </SheetDescription>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`px-2 py-1 text-xs font-medium ${
                  isActive
                    ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300'
                    : ''
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-1.5 ${
                    isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>

              {vendor.paymentType && (
                <Badge
                  variant="outline"
                  className="gap-1 px-2 py-1 text-xs bg-white/50 dark:bg-gray-800/50"
                >
                  <CreditCard className="h-3 w-3" />
                  {vendor.paymentType}
                </Badge>
              )}
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h3>

              {/* Email */}
              <div className="flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">Email</div>
                    {vendor.email ? (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                      >
                        {vendor.email}
                      </a>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </div>
                </div>
                {vendor.email && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copy('email', vendor.email)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy email"
                  >
                    {copied === 'email' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                    <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    {vendor.phone ? (
                      <a
                        href={`tel:${vendor.phone}`}
                        className="text-sm font-medium hover:text-green-600 dark:hover:text-green-400 transition-colors truncate block"
                      >
                        {vendor.phone}
                      </a>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </div>
                </div>
                {vendor.phone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copy('phone', vendor.phone)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy phone"
                  >
                    {copied === 'phone' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mt-0.5">
                  <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div className="text-sm font-medium whitespace-pre-wrap break-words">
                    {vendor.address || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company & Timeline Card */}
          <div className="grid gap-4">
            {/* Timeline */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created</span>
                    </div>
                    <div className="text-sm font-medium">
                      {prettyDate(vendor.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last Updated
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {prettyDate(vendor.updatedAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t  p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => onEdit(vendor)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => onDelete(vendor)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onToggle && (
                <Button
                  type="button"
                  variant={isActive ? 'secondary' : 'default'}
                  className="gap-2 flex-1 min-w-[120px]"
                  onClick={() => onToggle(vendor)}
                  disabled={pending}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}

              <SheetClose asChild>
                <Button type="button" variant="" className="">
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
