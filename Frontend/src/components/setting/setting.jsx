'use client';

import { useState, useEffect } from 'react';
import {
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
} from '@/features/settingsApi';
import { Building2, Upload, Receipt, FileText, Save, Loader2, CheckCircle2, Eye, EyeOff, Download, Printer, Phone, MapPin } from 'lucide-react';
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

// Currency options
const currencyOptions = [
  { code: 'PKR', name: 'Pakistani Rupee (PKR)', symbol: '₨' },
  { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
  { code: 'CUSTOM', name: 'Custom', symbol: '' },
];

// Field configurations
const fieldConfigs = {
  companySettings: [
    { key: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Enter company name', icon: Building2 },
    { key: 'contactPhone', label: 'Contact Phone', type: 'text', placeholder: 'Enter contact phone number', icon: Phone },
    { key: 'address', label: 'Address', type: 'text', placeholder: 'Enter company address', icon: MapPin },
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
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  switch (config.type) {
    case 'text':
    case 'number':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-semibold text-foreground">{config.label}</Label>
          </div>
          <Input 
            type={config.type} 
            {...commonProps} 
            min={config.min} 
            max={config.max} 
            step={config.step}
            className="h-11 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 transition-all duration-200"
          />
          {config.description && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>💡</span>
              {config.description}
            </p>
          )}
        </div>
      );
    case 'select':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-semibold text-foreground">{config.label}</Label>
          </div>
          <Select value={value?.toString()} onValueChange={onChange}>
            <SelectTrigger className="h-11 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg bg-background border border-input">
              {config.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary/5">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case 'switch':
      return (
        <div className="flex items-center justify-between p-4 rounded-lg border border-input bg-background/50 hover:bg-background/70 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <div>
              <Label htmlFor={id} className="text-sm font-semibold text-foreground cursor-pointer">{config.label}</Label>
              {config.description && (
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              )}
            </div>
          </div>
          <Switch 
            checked={value} 
            onCheckedChange={onChange} 
            id={id}
            className="data-[state=checked]:bg-primary h-6 w-11"
          />
        </div>
      );
    case 'textarea':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-semibold text-foreground">{config.label}</Label>
          </div>
          <div className="relative">
            <Textarea 
              {...commonProps} 
              value={typeof value === 'string' ? value : ''} 
              className="min-h-[180px] rounded-lg border border-input bg-background px-4 py-3 text-sm resize-y focus:ring-2 focus:ring-primary/30 transition-all duration-200"
            />
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-muted/80 rounded text-xs text-muted-foreground">
              {typeof value === 'string' ? value.length : 0} characters
            </div>
          </div>
        </div>
      );
    case 'file':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {renderIcon()}
            </div>
            <Label htmlFor={id} className="text-sm font-semibold text-foreground">{config.label}</Label>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-input bg-background/50">
            {value ? (
              <div className="relative group">
                <div className="h-20 w-20 rounded-lg border border-input overflow-hidden bg-background shadow-sm">
                  <img src={`${API_URL}${value?.replace(/\\/g, "/")}`} alt="Company logo" className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-input flex items-center justify-center bg-muted/20 group hover:border-primary/50 transition-colors duration-200">
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input 
                type="file" 
                accept={config.accept} 
                {...commonProps}
                className="file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-colors duration-200"
              />
              {config.description && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
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
    <Card className="bg-gradient-to-br from-background to-muted/30 border-input shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Live Preview
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">How your settings will appear</CardDescription>
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
            <h3 className="font-semibold text-foreground">{companySettings.companyName || 'Your Company'}</h3>
            <p className="text-xs text-muted-foreground mt-1">{companySettings.contactPhone || 'No phone number'}</p>
            <p className="text-xs text-muted-foreground">{companySettings.address || 'No address'}</p>
            <p className="text-xs text-muted-foreground">Next Invoice: {invoiceSettings.format.prefix || 'INV-'}001</p>
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
              variant={invoiceSettings.tax.isTaxPayerRegistered ? "default" : "secondary"} 
              className="text-xs font-medium px-2 py-1"
            >
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
    contactPhone: '',
    address: '',
    companyLogo: null,
  });
  const [invoiceSettings, setInvoiceSettings] = useState({
    format: { prefix: '', numbering: '', startNumber: 1 },
    currency: { code: '', symbol: '', customCode: '' },
    tax: { isTaxPayerRegistered: false, taxRateCash: 0, taxRateCard: 0 },
    template: { header: '', footer: '' },
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
      setCompanySettings({
        companyName: data.companyInfo.companyName || '',
        contactPhone: data.companyInfo.contactPhone || '',
        address: data.companyInfo.address || '',
        companyLogo: data.companyInfo.companyLogo || null,
      });
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
      <div className="flex justify-center items-center min-h-[400px] bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-20 shadow-sm">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/80 to-primary shadow-md">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">Company Settings</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <span>⚙️</span>
                    Manage your company configuration and invoice settings
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleSave} 
                    className="gap-2 px-6 py-2 h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={loading || isLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-sm">
                  <p>Save all settings changes</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-input shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Company Profile</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span>🏢</span>
                        Update your company information and branding
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
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

              <Card className="border border-input shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Receipt className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Invoice Settings</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span>🧾</span>
                        Configure invoice format, currency, tax, and printing
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue={Object.keys(fieldConfigs.invoiceSettings)[0]} className="space-y-5">
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
                    {Object.entries(fieldConfigs.invoiceSettings).map(([section, fields]) => (
                      <TabsContent key={section} value={section} className="space-y-5 animate-in fade-in-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

              <Card className="border border-input shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <FileText className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Terms and Conditions</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span>📄</span>
                        Define your company's terms and conditions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <RenderField
                    config={fieldConfigs.terms}
                    value={invoiceSettings.terms}
                    onChange={(value) => handleInvoiceChange('terms', fieldConfigs.terms.key, value)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <SettingsPreview 
                companySettings={companySettings} 
                invoiceSettings={invoiceSettings} 
              />
              
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-800">
                    <span>💡</span>
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-700">
                  <p>• Save changes after each section for best results</p>
                  <p>• Test invoice printing with different paper widths</p>
                  <p>• Keep terms and conditions clear and concise</p>
                  <p>• Use high-quality logos for professional appearance</p>
                  <p>• Ensure contact phone and address are accurate</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}