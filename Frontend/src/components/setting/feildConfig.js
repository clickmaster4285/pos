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



export const currencyOptions = [
  { code: 'PKR', name: 'Pakistani Rupee (PKR)', symbol: '₨' },
  { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
  { code: 'CUSTOM', name: 'Custom', symbol: '' },
];

export const fieldConfigs = {
  companySettings: [
    {
      key: 'companyName',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Enter company name',
      icon: Building2,
    },
    {
      key: 'contactPhone',
      label: 'Contact Phone',
      type: 'text',
      placeholder: 'Enter contact phone number',
      icon: Phone,
    },
    {
      key: 'address',
      label: 'Address',
      type: 'text',
      placeholder: 'Enter company address',
      icon: MapPin,
    },
    {
      key: 'companyLogo',
      label: 'Company Logo',
      type: 'file',
      accept: 'image/*',
      description: 'PNG, JPG up to 2MB',
      icon: Upload,
    },
  ],
  invoiceSettings: {
    format: [
      {
        key: 'prefix',
        label: 'Invoice Prefix',
        type: 'text',
        placeholder: 'INV-',
        icon: FileText,
      },
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
      {
        key: 'startNumber',
        label: 'Start Number',
        type: 'number',
        min: 1,
        icon: '123',
      },
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
      {
        key: 'symbol',
        label: 'Currency Symbol',
        type: 'text',
        placeholder: '$',
        maxLength: 3,
        icon: 'S',
      },
    ],
    tax: [
      {
        key: 'isTaxPayerRegistered',
        label: 'Registered Tax Payer',
        type: 'switch',
        icon: Eye,
      },
      {
        key: 'taxRateCash',
        label: 'Tax Cash Rate (%)',
        type: 'number',
        min: 0,
        max: 100,
        step: 0.1,
        conditional: 'isTaxPayerRegistered',
        icon: '%',
      },
      {
        key: 'taxRateCard',
        label: 'Tax Card Rate (%)',
        type: 'number',
        min: 0,
        max: 100,
        step: 0.1,
        conditional: 'isTaxPayerRegistered',
        icon: '%',
      },
    ],
  },
  terms: {
    key: 'terms',
    label: 'Terms Text',
    type: 'textarea',
    placeholder: 'Enter your terms and conditions',
    icon: FileText,
  },
};
