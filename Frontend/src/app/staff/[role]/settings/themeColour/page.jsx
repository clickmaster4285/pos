'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Palette, RotateCcw, Save, Info, Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const predefinedThemes = [
  {
    name: 'Ocean Blue',
    colors: {
      primary: '#0ea5e9',
      secondary: '#f0f9ff',
      accent: '#0284c7',
      background: '#ffffff',
      foreground: '#0f172a',
    },
  },
  {
    name: 'Forest Green',
    colors: {
      primary: '#059669',
      secondary: '#f0fdf4',
      accent: '#10b981',
      background: '#ffffff',
      foreground: '#0f172a',
    },
  },
  {
    name: 'Sunset Orange',
    colors: {
      primary: '#ea580c',
      secondary: '#fff7ed',
      accent: '#f97316',
      background: '#ffffff',
      foreground: '#0f172a',
    },
  },
  {
    name: 'Royal Purple',
    colors: {
      primary: '#7c3aed',
      secondary: '#faf5ff',
      accent: '#8b5cf6',
      background: '#ffffff',
      foreground: '#0f172a',
    },
  },
];

export default function ThemeCustomization() {
  const [currentTheme, setCurrentTheme] = useState({
    primary: '#1f2937',
    secondary: '#f1f5f9',
    accent: '#8b5cf6',
    background: '#ffffff',
    foreground: '#1f2937',
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleColorChange = (colorType, value) => {
    setCurrentTheme((prev) => ({
      ...prev,
      [colorType]: value,
    }));
  };

  const applyTheme = (theme) => {
    setCurrentTheme(theme.colors);
  };

  const resetToDefault = () => {
    setCurrentTheme({
      primary: '#1f2937',
      secondary: '#f1f5f9',
      accent: '#8b5cf6',
      background: '#ffffff',
      foreground: '#1f2937',
    });
  };

  const saveTheme = () => {
    // In a real app, this would save to backend/localStorage
    console.log('Saving theme:', currentTheme);
    alert('Theme saved successfully!');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className=" ">
          <div className="flex gap-3">
            <Palette className="h-8 w-8" />
            <h1 className="text-2xl font-bold mb-4">Customize Your Theme</h1>
          </div>
          <p className="text-md text-muted-foreground">
            Choose your colors to reflect your brand and create a personalized
            experience
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Color Customization Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Customization
                </CardTitle>
                <CardDescription>
                  Adjust your theme colors to match your brand identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="custom" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="custom">Custom Colors</TabsTrigger>
                    <TabsTrigger value="presets">Preset Themes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="custom" className="space-y-4">
                    {Object.entries(currentTheme).map(
                      ([colorType, colorValue]) => (
                        <div key={colorType} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={colorType}
                              className="capitalize font-medium"
                            >
                              {colorType}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-sm">
                                    {colorType === 'primary' &&
                                      'Main brand color used for buttons and highlights'}
                                    {colorType === 'secondary' &&
                                      'Background color for cards and secondary elements'}
                                    {colorType === 'accent' &&
                                      'Accent color for interactive elements and emphasis'}
                                    {colorType === 'background' &&
                                      'Main background color of the application'}
                                    {colorType === 'foreground' &&
                                      'Primary text color'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex gap-3 items-center">
                            <div
                              className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                              style={{ backgroundColor: colorValue }}
                            />
                            <div className="flex-1 space-y-2">
                              <Input
                                id={colorType}
                                type="color"
                                value={colorValue}
                                onChange={(e) =>
                                  handleColorChange(colorType, e.target.value)
                                }
                                className="w-full h-10"
                              />
                              <Input
                                type="text"
                                value={colorValue}
                                onChange={(e) =>
                                  handleColorChange(colorType, e.target.value)
                                }
                                placeholder="#000000"
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </TabsContent>

                  <TabsContent value="presets" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {predefinedThemes.map((theme, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => applyTheme(theme)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{theme.name}</h3>
                                <div className="flex gap-2 mt-2">
                                  {Object.values(theme.colors).map(
                                    (color, colorIndex) => (
                                      <div
                                        key={colorIndex}
                                        className="w-6 h-6 rounded-full border border-border"
                                        style={{ backgroundColor: color }}
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Apply
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    onClick={resetToDefault}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button
                    onClick={saveTheme}
                    className="flex-1"
                    style={{ backgroundColor: currentTheme.accent }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Theme
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your colors look in the application interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="space-y-4 p-6 rounded-lg border-2 border-dashed border-border"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.foreground,
                  }}
                >
                  {/* Preview Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Dashboard Preview</h2>
                    <Badge
                      style={{
                        backgroundColor: currentTheme.accent,
                        color: '#ffffff',
                      }}
                    >
                      New
                    </Badge>
                  </div>

                  {/* Preview Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: currentTheme.secondary }}
                    >
                      <h3 className="font-medium mb-2">Analytics</h3>
                      <p className="text-sm opacity-75">
                        View your performance metrics
                      </p>
                    </div>
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: currentTheme.secondary }}
                    >
                      <h3 className="font-medium mb-2">Posts</h3>
                      <p className="text-sm opacity-75">Manage your content</p>
                    </div>
                  </div>

                  {/* Preview Buttons */}
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-white"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      Primary Action
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{
                        backgroundColor: currentTheme.secondary,
                        color: currentTheme.foreground,
                      }}
                    >
                      Secondary Action
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-white"
                      style={{ backgroundColor: currentTheme.accent }}
                    >
                      Accent Action
                    </button>
                  </div>

                  {/* Preview Text */}
                  <div className="space-y-2">
                    <p className="text-sm">
                      This is how your text will appear with the selected
                      colors. Make sure there's enough contrast for readability.
                    </p>
                    <p className="text-xs opacity-75">
                      Secondary text appears with reduced opacity for hierarchy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Accessibility Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Accessibility Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  • Ensure sufficient contrast between text and background
                  colors
                </p>
                <p>• Test your theme in both light and dark environments</p>
                <p>
                  • Consider colorblind users when choosing color combinations
                </p>
                <p>
                  • Use color alongside other visual cues for important
                  information
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
