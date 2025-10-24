'use client';

import { useState, useEffect } from 'react';
import {
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
} from '@/features/settingsApi';
import {
  Building2,
  Upload,
  Receipt,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Download,
  Printer,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SettingsPreview from './SettingsPreview';
import CompanyProfileSection from './CompanyProfileSection';
import InvoiceSettingsSection from './InvoiceSettingsSection';
import TermsSection from './TermsSection';
import { fieldConfigs, currencyOptions } from './feildConfig';
import SubscriptionModuleCard from './SubscriptionModuleCard';
import EmailChangeSection from './EmailChangeSection';

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
  const company = data?.data || data || null;

  const plans = company?.plan || [];

  const [updateCompanySettings] = useUpdateCompanySettingsMutation();

  useEffect(() => {
    if (data?.invoiceSettings && data?.companyInfo) {
      setInvoiceSettings({
        ...data.invoiceSettings,
        terms:
          typeof data.invoiceSettings.terms === 'string'
            ? data.invoiceSettings.terms
            : '',
        currency: {
          ...data.invoiceSettings.currency,
          customCode:
            data.invoiceSettings.currency.code &&
            !currencyOptions.some(
              (c) => c.code === data.invoiceSettings.currency.code
            )
              ? data.invoiceSettings.currency.code
              : '',
          code:
            data.invoiceSettings.currency.code &&
            !currencyOptions.some(
              (c) => c.code === data.invoiceSettings.currency.code
            )
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
      const selectedCurrency = currencyOptions.find((c) => c.code === value);
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
      setInvoiceSettings((prev) => ({ ...prev, terms: stringValue }));
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
          code:
            invoiceSettings.currency.code === 'CUSTOM'
              ? invoiceSettings.currency.customCode
              : invoiceSettings.currency.code,
        },
      };
      const settings = { invoiceSettings: finalSettings, companySettings };
      const result = await updateCompanySettings({
        companyId,
        settings,
        logoFile,
      }).unwrap();

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
          <p className="text-sm text-muted-foreground font-medium">
            Loading your settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <header>
          <div className="mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-medium mt-4 text-foreground tracking-tight">
                    Company Settings
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    Manage your company configuration and invoice settings
                  </p>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSave} disabled={loading || isLoading}>
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

        <main className="mx-auto px-4 py-4 max-w-full">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <EmailChangeSection company={company} />

              <CompanyProfileSection
                companySettings={companySettings}
                onCompanyChange={handleCompanyChange}
                fieldConfigs={fieldConfigs}
              />
              <SubscriptionModuleCard
                companyPlan={plans}
                title="Company Plan"
                readOnly
              />
            </div>

            <div className="space-y-6">
              <SettingsPreview
                companySettings={companySettings}
                invoiceSettings={invoiceSettings}
              />
              <InvoiceSettingsSection
                invoiceSettings={invoiceSettings}
                onInvoiceChange={handleInvoiceChange}
                fieldConfigs={fieldConfigs}
              />
              <TermsSection
                termsValue={invoiceSettings.terms}
                onChange={handleInvoiceChange}
                fieldConfigs={fieldConfigs}
              />

              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-800">
                    <span>💡</span> Tips
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
