'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import RenderField from './RenderField';

export default function InvoiceSettingsSection({
  invoiceSettings,
  onInvoiceChange,
  fieldConfigs,
}) {
  return (
    <Card className="border border-input shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Invoice Settings
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              Configure invoice format, currency, tax, and printing
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs
          defaultValue={Object.keys(fieldConfigs.invoiceSettings)[0]}
          className="space-y-5"
        >
          <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/40 rounded-lg h-11">
            {Object.keys(fieldConfigs.invoiceSettings).map((section) => (
              <TabsTrigger
                key={section}
                value={section}
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all duration-200"
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(fieldConfigs.invoiceSettings).map(
            ([section, fields]) => (
              <TabsContent
                key={section}
                value={section}
                className="space-y-5 animate-in fade-in-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {fields.map((config) => (
                    <RenderField
                      key={config.key}
                      config={config}
                      value={invoiceSettings[section][config.key]}
                      onChange={(value) =>
                        onInvoiceChange(section, config.key, value)
                      }
                      section={section}
                      values={invoiceSettings[section]}
                    />
                  ))}
                </div>
              </TabsContent>
            )
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
