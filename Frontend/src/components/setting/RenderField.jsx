'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Eye, Upload } from 'lucide-react';

export default function RenderField({
  config,
  value,
  onChange,
  section,
  values,
}) {
  const id = `${section ? `${section}-` : ''}${config.key}`;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    // exactly as in your component
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
            <Label
              htmlFor={id}
              className="text-sm font-semibold text-foreground"
            >
              {config.label}
            </Label>
          </div>
          <Input
            type={config.type}
            {...commonProps}
            min={config.min}
            max={config.max}
            step={config.step}
            className="h-11 rounded-lg border border-input px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 transition-all duration-200"
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
            <Label
              htmlFor={id}
              className="text-sm font-semibold text-foreground"
            >
              {config.label}
            </Label>
          </div>
          <Select value={value?.toString()} onValueChange={onChange}>
            <SelectTrigger className="h-11 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg bg-background border border-input">
              {config.options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary/5"
                >
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
              <Label
                htmlFor={id}
                className="text-sm font-semibold text-foreground cursor-pointer"
              >
                {config.label}
              </Label>
              {config.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {config.description}
                </p>
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
            <Label
              htmlFor={id}
              className="text-sm font-semibold text-foreground"
            >
              {config.label}
            </Label>
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
            <Label
              htmlFor={id}
              className="text-sm font-semibold text-foreground"
            >
              {config.label}
            </Label>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-input ">
            {value ? (
              <div className="relative group">
                <div className="h-20 w-20 rounded-lg border border-input overflow-hidden bg-background shadow-sm">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${String(
                      value
                    )?.replace(/\\/g, '/')}`}
                    alt="Company logo"
                    className="h-full w-full object-cover"
                  />
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
              {/* Hidden real input */}
              <input
                id={id}
                type="file"
                accept={config.accept}
                onChange={commonProps.onChange}
                className="sr-only"
              />

              {/* Custom button */}
              <label
                htmlFor={id}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/90 to-secondary-foreground/90 px-4 py-2 text-sm font-semibold text-card hover:bg-secondary-foreground/90 transition-colors duration-200 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </label>

              {/* Optional: show selected file name (works when value is a File) */}
              {value instanceof File && (
                <p className="text-xs text-muted-foreground">{value.name}</p>
              )}

              {config.description && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
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
}
