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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  Shield,
  Calendar,
} from 'lucide-react';

export default function StaffDetailsSheet({
  open,
  onOpenChange,
  staff,
  onEdit,
}) {
  const initials =
    (staff?.name || '')
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase() || 'S';

  const activePermissions = staff?.permissions
    ? Object.entries(staff.permissions)
      .filter(([_, value]) => value)
      .map(([key]) => key)
    : [];

  const inactivePermissions = staff?.permissions
    ? Object.entries(staff.permissions)
      .filter(([_, value]) => !value)
      .map(([key]) => key)
    : [];

  const getLastUpdatedFromHistory = (s) => {
    const history = Array.isArray(s?.history) ? s.history : [];

    // Find newest timestamp in history
    let latest = 0;
    for (const h of history) {
      const t = Date.parse(h?.createdAt || h?.timestamp || '');
      if (Number.isFinite(t) && t > latest) latest = t;
    }

    // Fallbacks: updatedAt → createdAt
    const fallback = Math.max(
      latest,
      Date.parse(s?.updatedAt || '') || 0,
      Date.parse(s?.createdAt || '') || 0
    );

    return fallback ? new Date(fallback).toLocaleString() : null;
  };
  const lastUpdated = React.useMemo(
    () => getLastUpdatedFromHistory(staff),
    [staff]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-5"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl font-bold truncate">
                {staff?.name || '—'}
              </SheetTitle>
              <SheetDescription className="text-base truncate flex items-center gap-1 mt-1">
                <Mail className="h-4 w-4" />
                {staff?.email || '—'}
              </SheetDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                {staff?.department && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <Building className="h-3 w-3" />
                    {staff.department}
                  </Badge>
                )}
                {staff?.subRole && (
                  <Badge className="flex items-center gap-1 px-3 py-1">
                    <User className="h-3 w-3" />
                    {staff.subRole}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto pb-4 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium text-base">
                        {staff?.phone || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        Address
                      </div>
                      <div className="font-medium text-base leading-relaxed">
                        {staff?.address || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {staff?.hireDate && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Hire Date
                        </div>
                        <div className="font-medium text-base">
                          {staff.hireDate}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add more contact fields here if needed */}
                  <div className="h-10 flex items-center">
                    <div className="text-sm text-muted-foreground">
                      {/* Placeholder for additional fields */}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Permissions & Access
              </h3>

              {activePermissions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-green-600 mb-3">
                    Active Permissions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activePermissions.map((permission) => (
                      <Badge
                        key={permission}
                        variant="default"
                        className="justify-center py-2 bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                      >
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {inactivePermissions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Inactive Permissions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {inactivePermissions.map((permission) => (
                      <Badge
                        key={permission}
                        variant="outline"
                        className="justify-center py-2 text-muted-foreground"
                      >
                        {permission} (off)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!staff?.permissions && (
                <div className="text-center py-8 text-muted-foreground">
                  No permissions configured
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information Section - You can add more cards here */}
          {staff?.notes && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {staff.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <SheetFooter className="flex flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated || 'Unknown'}
          </div>

          <div className="flex gap-3">
            <SheetClose asChild>
              <Button variant="outline" className="min-w-24">
                Close
              </Button>
            </SheetClose>
            {onEdit && staff && (
              <Button onClick={() => onEdit(staff)} className="min-w-24">
                Edit Staff
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
