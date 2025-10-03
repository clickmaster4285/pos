'use client';

import { useState, useEffect } from 'react';
import {
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
} from '@/features/settingsApi';
import { Building2, Upload, Receipt, FileText, Save, Loader2, CheckCircle2, Eye, EyeOff, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Currency options (can be fetched from an API or config file)
const currencyOptions = [
  { code: 'PKR', name: 'Pakistani Rupee (PKR)', symbol: '₨' },
  { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
  { code: 'CUSTOM', name: 'Custom', symbol: '' },
];

// Define field configurations for dynamic rendering
const fieldConfigs = {
  companySettings: [
    { key: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Enter company name', icon: Building2 },
    { key: 'companyLogo', label: 'Company Logo', type: 'file', accept: 'image/*', description: 'PNG, JPG up to 2MB', icon: Upload },
  ],
  invoiceSettings: {
    format: [
      { key: 'prefix', label: 'Invoice Prefix', type: 'text', placeholder: 'INV-', icon: FileText },
      {
        key: 'numbering',
        label: 'Numbering System',
        type: 'select',
        options: [
          { value: 'sequential', label: 'Sequential' },
          { value: 'yearly', label: 'Yearly Reset' },
        ],
        icon: Receipt,
      },
      { key: 'startNumber', label: 'Start Number', type: 'number', min: 1, icon: '123' },
    ],
    currency: [
      {
        key: 'code',
        label: 'Currency Code',
        type: 'select',
        options: currencyOptions.map((c) => ({ value: c.code, label: c.name })),
        icon: '$',
      },
      {
        key: 'customCode',
        label: 'Custom Currency Code',
        type: 'text',
        placeholder: 'Enter custom currency code (e.g., INR)',
        conditional: 'code:CUSTOM',
        icon: 'C',
      },
      { key: 'symbol', label: 'Currency Symbol', type: 'text', placeholder: '$', maxLength: 3, icon: 'S' },
    ],
    tax: [
      { key: 'isTaxPayerRegistered', label: 'Registered Tax Payer', type: 'switch', icon: Eye },
      { key: 'taxRateCash', label: 'Tax Cash Rate (%)', type: 'number', min: 0, max: 100, step: 0.1, conditional: 'isTaxPayerRegistered', icon: '%' },
      { key: 'taxRateCard', label: 'Tax Card Rate (%)', type: 'number', min: 0, max: 100, step: 0.1, conditional: 'isTaxPayerRegistered', icon: '%' },
    ],
    thermalPrint: [
      {
        key: 'paperWidth',
        label: 'Paper Width',
        type: 'select',
        options: [
          { value: '58', label: '58mm' },
          { value: '80', label: '80mm' },
        ],
        icon: Printer,
      },
      { key: 'fontSize', label: 'Font Size', type: 'number', min: 8, max: 16, icon: 'A' },
      { key: 'showLogo', label: 'Show Logo on Thermal Print', type: 'switch', icon: Eye },
    ],
  },
  terms: { key: 'terms', label: 'Terms Text', type: 'textarea', placeholder: 'Enter your terms and conditions', icon: FileText },
};

// Enhanced Field Renderer Component
const RenderField = ({ config, value, onChange, section, values }) => {
  const id = `${section ? `${section}-` : ''}${config.key}`;
  const commonProps = {
    id,
    value: config.type !== 'file' ? value : undefined,
    onChange: (e) => {
      if (config.type === 'file') {
        onChange(e.target.files?.[0]);
      } else if (config.type === 'number') {
        onChange(parseFloat(e.target.value) || 0);
      } else if (config.type === 'switch') {
        onChange(e);
      } else {
        onChange(e.target.value);
      }
    },
    placeholder: config.placeholder,
    className: config.type === 'file' ? 'cursor-pointer' : '',
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Handle conditional rendering based on other field values
  if (config.conditional) {
    const [condField, condValue] = config.conditional.split(':');
    if (values[condField] !== condValue && values[condField] !== true) {
      return null;
    }
  }

  const renderIcon = () => {
    if (typeof config.icon === 'string') {
      return <span className="text-sm font-medium">{config.icon}</span>;
    }
    const IconComponent = config.icon;
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  switch (config.type) {
    case 'text':
    case 'number':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-medium">{config.label}</Label>
          </div>
          <Input 
            type={config.type} 
            {...commonProps} 
            min={config.min} 
            max={config.max} 
            step={config.step}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {config.description && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>💡</span>
              {config.description}
            </p>
          )}
        </div>
      );
    case 'select':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-medium">{config.label}</Label>
          </div>
          <Select value={value?.toString()} onValueChange={onChange}>
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="flex items-center gap-2">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case 'switch':
      return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <div>
              <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{config.label}</Label>
              {config.description && (
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              )}
            </div>
          </div>
          <Switch 
            checked={value} 
            onCheckedChange={onChange} 
            id={id}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      );
    case 'textarea':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-medium">{config.label}</Label>
          </div>
          <div className="relative">
            <Textarea 
              {...commonProps} 
              value={typeof value === 'string' ? value : ''} 
              className="min-h-[200px] resize-y transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
              {typeof value === 'string' ? value.length : 0} characters
            </div>
          </div>
        </div>
      );
    case 'file':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-medium">{config.label}</Label>
          </div>
          <div className="flex items-center gap-6 p-4 rounded-lg border bg-card/50">
            {value ? (
              <div className="relative group">
                <div className="h-24 w-24 rounded-xl border-2 border-border overflow-hidden bg-card shadow-sm">
                    {console.log(`the imge are: ${API_URL}${value}`)}
                  <img src={`https://localhost:8000/${value?.replace(/\\/g, "/")}`} alt="Company logo" className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 group hover:border-primary/50 transition-colors duration-200">
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input 
                type="file" 
                accept={config.accept} 
                {...commonProps}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-colors duration-200"
              />
              {config.description && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>📝</span>
                  {config.description}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};

// Preview Card Component
const SettingsPreview = ({ companySettings, invoiceSettings }) => {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Live Preview
        </CardTitle>
        <CardDescription>How your settings will appear</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {companySettings.companyLogo && (
            <div className="h-12 w-12 rounded-lg border overflow-hidden bg-white">
              <img 
                src={companySettings.companyLogo} 
                alt="Company logo" 
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">{companySettings.companyName || 'Your Company'}</h3>
            <p className="text-xs text-muted-foreground">Next Invoice: {invoiceSettings.format.prefix || 'INV-'}001</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Currency</p>
            <p className="font-medium">
              {invoiceSettings.currency.code === 'CUSTOM' 
                ? invoiceSettings.currency.customCode 
                : invoiceSettings.currency.code} 
              ({invoiceSettings.currency.symbol})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tax Registered</p>
            <Badge variant={invoiceSettings.tax.isTaxPayerRegistered ? "default" : "secondary"} className="text-xs">
              {invoiceSettings.tax.isTaxPayerRegistered ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Settings({ companyId }) {
  const [companySettings, setCompanySettings] = useState({
    companyName: '',
    companyLogo: null,
  });
  const [invoiceSettings, setInvoiceSettings] = useState({
    format: { prefix: '', numbering: '', startNumber: 1 },
    currency: { code: '', symbol: '', customCode: '' },
    tax: { isTaxPayerRegistered: false, taxRateCash: 0, taxRateCard: 0 },
    template: { header: '', footer: '' },
    thermalPrint: { paperWidth: 58, fontSize: 12, showLogo: true },
    terms: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data, isLoading, error } = useGetCompanySettingsQuery();
  const [updateCompanySettings] = useUpdateCompanySettingsMutation();

  useEffect(() => {
    if (data?.invoiceSettings && data?.companyInfo) {
      setInvoiceSettings({
        ...data.invoiceSettings,
        terms: typeof data.invoiceSettings.terms === 'string' ? data.invoiceSettings.terms : '',
        currency: {
          ...data.invoiceSettings.currency,
          customCode: data.invoiceSettings.currency.code && !currencyOptions.some(c => c.code === data.invoiceSettings.currency.code) 
            ? data.invoiceSettings.currency.code 
            : '',
          code: data.invoiceSettings.currency.code && !currencyOptions.some(c => c.code === data.invoiceSettings.currency.code) 
            ? 'CUSTOM' 
            : data.invoiceSettings.currency.code,
        },
      });
      setCompanySettings(data.companyInfo);
    }
    if (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, [data, error]);

  const handleCompanyChange = (field, value) => {
    if (field === 'companyLogo' && value instanceof File) {
      setLogoFile(value);
      const previewUrl = URL.createObjectURL(value);
      setCompanySettings((prev) => ({ ...prev, companyLogo: previewUrl }));
    } else {
      setCompanySettings((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleInvoiceChange = (section, field, value) => {
    if (section === 'currency' && field === 'code') {
      const selectedCurrency = currencyOptions.find(c => c.code === value);
      if (selectedCurrency && value !== 'CUSTOM') {
        setInvoiceSettings((prev) => ({
          ...prev,
          currency: {
            ...prev.currency,
            code: value,
            symbol: selectedCurrency.symbol,
            customCode: '',
          },
        }));
      } else {
        setInvoiceSettings((prev) => ({
          ...prev,
          currency: { ...prev.currency, code: value, customCode: '' },
        }));
      }
    } else if (section === 'currency' && field === 'customCode') {
      setInvoiceSettings((prev) => ({
        ...prev,
        currency: { ...prev.currency, customCode: value },
      }));
    } else if (section === 'terms') {
      const stringValue = typeof value === 'string' ? value : '';
      setInvoiceSettings((prev) => ({
        ...prev,
        terms: stringValue,
      }));
    } else {
      setInvoiceSettings((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const finalSettings = {
        ...invoiceSettings,
        currency: {
          ...invoiceSettings.currency,
          code: invoiceSettings.currency.code === 'CUSTOM' ? invoiceSettings.currency.customCode : invoiceSettings.currency.code,
        },
      };
      const settings = { invoiceSettings: finalSettings, companySettings };
      const result = await updateCompanySettings({ companyId, settings, logoFile }).unwrap();
      if (result.companySettings?.logoUrl) {
        handleCompanyChange('companyLogo', result.companySettings.logoUrl);
        if (companySettings.companyLogo?.startsWith('blob:')) {
          URL.revokeObjectURL(companySettings.companyLogo);
        }
      }
      setLogoFile(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold  bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Company Settings
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span>⚙️</span>
                    Manage your company configuration and invoice settings
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleSave} 
                    className="gap-2 px-6 shadow-lg transition-all duration-200 hover:shadow-xl"
                    disabled={loading || isLoading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save all settings changes</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Company Profile</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span>🏢</span>
                        Update your company information and branding
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {fieldConfigs.companySettings.map((config) => (
                    <RenderField
                      key={config.key}
                      config={config}
                      value={companySettings[config.key]}
                      onChange={(value) => handleCompanyChange(config.key, value)}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Receipt className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Invoice Settings</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span>🧾</span>
                        Configure invoice format, currency, tax, and printing
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={Object.keys(fieldConfigs.invoiceSettings)[0]} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/50 rounded-lg">
                      {Object.keys(fieldConfigs.invoiceSettings).map((section) => (
                        <TabsTrigger 
                          key={section} 
                          value={section}
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          {section.charAt(0).toUpperCase() + section.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {Object.entries(fieldConfigs.invoiceSettings).map(([section, fields]) => (
                      <TabsContent key={section} value={section} className="space-y-6 animate-in fade-in-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {fields.map((config) => (
                            <RenderField
                              key={config.key}
                              config={config}
                              value={invoiceSettings[section][config.key]}
                              onChange={(value) => handleInvoiceChange(section, config.key, value)}
                              section={section}
                              values={invoiceSettings[section]}
                            />
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-green-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <FileText className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Terms and Conditions</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span>📄</span>
                        Define your company's terms and conditions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RenderField
                    config={fieldConfigs.terms}
                    value={invoiceSettings.terms}
                    onChange={(value) => handleInvoiceChange('terms', fieldConfigs.terms.key, value)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <SettingsPreview 
                companySettings={companySettings} 
                invoiceSettings={invoiceSettings} 
              />
              
              {/* <Card className="bg-muted/30 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <FileText className="h-4 w-4" />
                    Export Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Printer className="h-4 w-4" />
                    Print Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Eye className="h-4 w-4" />
                    Preview Invoice
                  </Button>
                </CardContent>
              </Card> */}

              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <span>💡</span>
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-700">
                  <p>• Save changes after each section for best results</p>
                  <p>• Test invoice printing with diffe rent paper widths</p>
                  <p>• Keep terms and conditions clear and concise</p>
                  <p>• Use high-quality logos for professional appearance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}