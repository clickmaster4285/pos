'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import RenderField from './RenderField';

export default function TermsSection({ termsValue, onChange, fieldConfigs }) {
  return (
    <Card className="border border-input shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Terms and Conditions
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              Define your company's terms and conditions
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <RenderField
          config={fieldConfigs.terms}
          value={termsValue}
          onChange={(value) => onChange('terms', fieldConfigs.terms.key, value)}
        />
      </CardContent>
    </Card>
  );
}
