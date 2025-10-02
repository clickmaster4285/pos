'use client';

import { useState, useEffect } from 'react';
import { useGetInvoiceSettingsQuery, useUpdateInvoiceSettingsMutation } from '@/features/settingsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceSettingsForm({ companyId }) {
  const [settings, setSettings] = useState({
    format: {
      prefix: 'INV-',
      numbering: 'sequential',
      startNumber: 1,
    },
    currency: {
      code: 'PKR',
      symbol: '₨',
    },
    tax: {
      isTaxPayerRegistered: false,
      taxRate: 0,
    },
    template: {
      header: '',
      footer: '',
      logoUrl: '',
    },
    thermalPrint: {
      paperWidth: 58,
      fontSize: 12,
      showLogo: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch existing settings
  const { data, isLoading, error } = useGetInvoiceSettingsQuery(companyId, { skip: !companyId });

  useEffect(() => {
    if (data?.invoiceSettings) {
      setSettings(data.invoiceSettings);
    }
    if (error) {
      toast.error('Failed to fetch settings');
    }
  }, [data, error]);

  const [updateInvoiceSettings] = useUpdateInvoiceSettingsMutation();

  const handleChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      await updateInvoiceSettings({ companyId, settings }).unwrap();
      setSaveSuccess(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Invoice Settings</h1>
        <p className="text-muted-foreground">
          Configure your invoice format, currency, tax settings, and printing preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="format" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            {/* <TabsTrigger value="template">Template</TabsTrigger> */}
            <TabsTrigger value="thermal">Thermal Print</TabsTrigger>
          </TabsList>

          {/* Format Tab */}
          <TabsContent value="format">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Format</CardTitle>
                <CardDescription>
                  Configure how your invoice numbers are generated and formatted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Invoice Prefix</Label>
                    <Input
                      id="prefix"
                      value={settings.format.prefix}
                      onChange={(e) => handleChange('format', 'prefix', e.target.value)}
                      placeholder="INV-"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="numbering">Numbering System</Label>
                    <Select
                      value={settings.format.numbering}
                      onValueChange={(value) => handleChange('format', 'numbering', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequential</SelectItem>
                        <SelectItem value="yearly">Yearly Reset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startNumber">Start Number</Label>
                    <Input
                      id="startNumber"
                      type="number"
                      value={settings.format.startNumber}
                      onChange={(e) => handleChange('format', 'startNumber', parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currency Tab */}
          <TabsContent value="currency">
            <Card>
              <CardHeader>
                <CardTitle>Currency Settings</CardTitle>
                <CardDescription>
                  Set your preferred currency for invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currencyCode">Currency Code</Label>
                    <Select
                      value={settings.currency.code}
                      onValueChange={(value) => handleChange('currency', 'code', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKR">Pakistani Rupee (PKR)</SelectItem>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currencySymbol">Currency Symbol</Label>
                    <Input
                      id="currencySymbol"
                      value={settings.currency.symbol}
                      onChange={(e) => handleChange('currency', 'symbol', e.target.value)}
                      placeholder="$"
                      maxLength={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Tab */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>
                  Configure tax registration and rates for your invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.tax.isTaxPayerRegistered}
                    onCheckedChange={(checked) => handleChange('tax', 'isTaxPayerRegistered', checked)}
                    id="tax-registered"
                  />
                  <Label htmlFor="tax-registered">Registered Tax Payer</Label>
                </div>

                {settings.tax.isTaxPayerRegistered && (
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={settings.tax.taxRate}
                      onChange={(e) => handleChange('tax', 'taxRate', parseFloat(e.target.value))}
                      min={0}
                      max={100}
                      step="0.1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template">
            <Card>
              <CardHeader>
                <CardTitle>Template Customization</CardTitle>
                <CardDescription>
                  Customize the appearance and content of your invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.template.logoUrl}
                    onChange={(e) => handleChange('template', 'logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header">Header Content</Label>
                  <Textarea
                    id="header"
                    value={settings.template.header}
                    onChange={(e) => handleChange('template', 'header', e.target.value)}
                    placeholder="Enter custom header content..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer">Footer Content</Label>
                  <Textarea
                    id="footer"
                    value={settings.template.footer}
                    onChange={(e) => handleChange('template', 'footer', e.target.value)}
                    placeholder="Enter custom footer content..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Thermal Print Tab */}
          <TabsContent value="thermal">
            <Card>
              <CardHeader>
                <CardTitle>Thermal Print Settings</CardTitle>
                <CardDescription>
                  Configure settings for thermal printer compatibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paperWidth">Paper Width</Label>
                    <Select
                      value={settings.thermalPrint.paperWidth.toString()}
                      onValueChange={(value) => handleChange('thermalPrint', 'paperWidth', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58">58mm</SelectItem>
                        <SelectItem value="80">80mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      value={settings.thermalPrint.fontSize}
                      onChange={(e) => handleChange('thermalPrint', 'fontSize', parseInt(e.target.value))}
                      min={8}
                      max={16}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.thermalPrint.showLogo}
                    onCheckedChange={(checked) => handleChange('thermalPrint', 'showLogo', checked)}
                    id="show-logo"
                  />
                  <Label htmlFor="show-logo">Show Logo on Thermal Print</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading || isLoading}
            className="min-w-32"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}