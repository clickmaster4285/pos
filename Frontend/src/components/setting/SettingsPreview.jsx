'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

export default function SettingsPreview({ companySettings, invoiceSettings }) {
  
  return (
    <Card className="bg-background border-input shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Live Preview
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          How your settings will appear
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {companySettings.companyLogo && (
            <div className="h-14 w-14 rounded-lg border border-input overflow-hidden bg-white shadow-sm">
              <img
                src={companySettings.companyLogo}
                alt="Company logo"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">
              {companySettings.companyName || 'Your Company'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {companySettings.contactPhone || 'No phone number'}
            </p>
            <p className="text-xs text-muted-foreground">
              {companySettings.address || 'No address'}
            </p>
            <p className="text-xs text-muted-foreground">
              Next Invoice: {invoiceSettings.format.prefix || 'INV-'}001
            </p>
          </div>
        </div>

        <Separator className="bg-input/50" />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="font-medium text-foreground">
              {invoiceSettings.currency.code === 'CUSTOM'
                ? invoiceSettings.currency.customCode
                : invoiceSettings.currency.code}
              ({invoiceSettings.currency.symbol})
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tax Registered</p>
            <Badge
              variant={
                invoiceSettings.tax.isTaxPayerRegistered
                  ? 'default'
                  : 'secondary'
              }
              className="text-xs font-medium px-2 py-2"
            >
              {invoiceSettings.tax.isTaxPayerRegistered ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
