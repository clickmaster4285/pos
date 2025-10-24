'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import RenderField from './RenderField';

export default function CompanyProfileSection({
  companySettings,
  onCompanyChange,
  fieldConfigs,
}) {
  return (
    <Card className="border border-input shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Company Profile
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              Update your company information and branding
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {fieldConfigs.companySettings.map((config) => (
          <RenderField
            key={config.key}
            config={config}
            value={companySettings[config.key]}
            onChange={(value) => onCompanyChange(config.key, value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
