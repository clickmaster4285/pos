"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUpdateSuperAdminInfoMutation } from "@/features/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Mail,
  Lock,
  Settings,
  Building,
  Image,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SuperAdminUpdatePage = () => {
  const [settings, setSettings] = useState({
    name: "",
    email: "",
    password: "",
    toolName: "",
    toolLogo: null,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [superAdmin, setSuperAdmin] = useState(null);
  const [message, setMessage] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [updateSuperAdminInfo, { isLoading: isUpdating, error: updateError }] = useUpdateSuperAdminInfoMutation();

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  // Fetch super admin data with auto-refresh capability
  const fetchSuperAdmin = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const authState = sessionStorage.getItem("authUser");
      if (authState) {
        const parsedUser = JSON.parse(authState);
        if (parsedUser.role === "superAdmin") {
          setSuperAdmin(parsedUser);
          setSettings({
            name: parsedUser.name || "",
            email: parsedUser.email || "",
            password: "",
            toolName: parsedUser.toolName || "",
            toolLogo: parsedUser.toolLogo || null,
          });
          setLogoPreview(parsedUser.toolLogo ? `${API_URL}${parsedUser.toolLogo.replace(/\\/g, "/")}` : null);
          setLastUpdated(new Date());
        } else {
          setMessage({ type: "error", text: "Access denied: Not a SuperAdmin" });
        }
      } else {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          cache: 'no-cache'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data.role === "superAdmin") {
            setSuperAdmin(data.data);
            setSettings({
              name: data.data.name || "",
              email: data.data.email || "",
              password: "",
              toolName: data.data.toolName || "",
              toolLogo: data.data.toolLogo || null,
            });
            setLogoPreview(data.data.toolLogo ? `${API_URL}${data.data.toolLogo.replace(/\\/g, "/")}` : null);
            setLastUpdated(new Date());
          } else {
            setMessage({ type: "error", text: "Access denied: Not a SuperAdmin" });
          }
        } else {
          setMessage({ type: "error", text: "No SuperAdmin data found" });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error retrieving SuperAdmin data" });
      console.error("[SuperAdminUpdatePage] Error fetching auth/me:", err.message);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  }, [API_URL]);

  // Initial data fetch
  useEffect(() => {
    fetchSuperAdmin();
  }, [fetchSuperAdmin]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSuperAdmin(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchSuperAdmin]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleInputChange = (field, value) => {
    if (field === "toolLogo" && value instanceof File) {
      if (value.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size exceeds 2MB limit" });
        return;
      }
      if (!["image/jpeg", "image/png", "image/svg+xml", "image/webp"].includes(value.type)) {
        setMessage({ type: "error", text: "Only JPEG, PNG, SVG, and WebP files are allowed" });
        return;
      }
      setLogoFile(value);
      const previewUrl = URL.createObjectURL(value);
      setLogoPreview(previewUrl);
    } else {
      setSettings((prev) => ({ ...prev, [field]: value }));
    }
    setMessage(null);
  };

  const handleManualRefresh = () => {
    fetchSuperAdmin(true);
    setMessage({ type: "success", text: "Data refreshed successfully!" });
  };

  const confirmUpdate = async () => {
    try {
      // Validate inputs
      if (settings.email && !validateEmail(settings.email)) {
        setMessage({ type: "error", text: "Invalid email format" });
        setIsConfirmOpen(false);
        return;
      }
      if (settings.password && !validatePassword(settings.password)) {
        setMessage({ type: "error", text: "Password must be at least 8 characters" });
        setIsConfirmOpen(false);
        return;
      }

      const formData = new FormData();
      if (settings.name.trim()) formData.append("name", settings.name.trim());
      if (settings.email.trim()) formData.append("email", settings.email.trim());
      if (settings.password.trim()) formData.append("password", settings.password.trim());
      if (settings.toolName.trim()) formData.append("toolName", settings.toolName.trim());
      if (logoFile) formData.append("toolLogo", logoFile);

      // Check if FormData is empty
      if (!formData.entries().next().value) {
        setMessage({ type: "error", text: "No valid fields provided for update" });
        setIsConfirmOpen(false);
        return;
      }

      const response = await updateSuperAdminInfo(formData).unwrap();

      if (response.success) {
        setMessage({ type: "success", text: response.message || "SuperAdmin information updated successfully" });
        const updatedUser = {
          ...superAdmin,
          name: response.data.name || superAdmin.name,
          email: response.data.email || superAdmin.email,
          toolName: response.data.toolName || superAdmin.toolName,
          toolLogo: response.data.toolLogo || superAdmin.toolLogo,
        };
        sessionStorage.setItem("authUser", JSON.stringify(updatedUser));
        setSuperAdmin(updatedUser);
        setLogoPreview(response.data.toolLogo ? `${API_URL}${response.data.toolLogo.replace(/\\/g, "/")}` : null);
        setSettings((prev) => ({ ...prev, password: "" }));
        setLogoFile(null);
        setLastUpdated(new Date());
        window.location.reload(true);
        // Auto-refresh data after successful update
        setTimeout(() => {
          fetchSuperAdmin(true);
        }, 1000);
      } else {
        setMessage({ type: "error", text: response.message || "Failed to update information" });
      }
    } catch (err) {
      console.error("❌ Frontend error:", err);
      setMessage({
        type: "error",
        text: err?.data?.message || err?.message || "Failed to update SuperAdmin information",
      });
    }
    setIsConfirmOpen(false);
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "SA"
    );
  };

  const formatLastUpdated = (date) => {
    if (!date) return "Never";
    return date.toLocaleTimeString() + " " + date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Settings
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your profile information and platform settings
            {lastUpdated && (
              <span className="block text-sm text-green-600 mt-2">
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - User Info */}
          <Card className="lg:col-span-1 shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg mx-auto">
                    <AvatarImage src={logoPreview || null} alt={settings.name || "Super Admin"} />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(settings.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {settings.name || "Super Administrator"}
                  </h2>
                  <p className="text-sm text-muted-foreground break-all">
                    {settings.email || "admin@example.com"}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tool Name:</span>
                    <span className="font-medium text-foreground">{settings.toolName || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium text-foreground">
                      {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Settings Panel */}
          <Card className="lg:col-span-2 shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-blue-600" />
                Platform Configuration
              </CardTitle>
              <CardDescription>Update your personal information and platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                  className="mb-6 animate-in fade-in duration-300 border"
                >
                  <div className="flex items-center gap-2">
                    {message.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription className="font-medium">{message.text}</AlertDescription>
                  </div>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="platform" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Platform
                  </TabsTrigger>
                </TabsList>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsConfirmOpen(true);
                  }}
                >
                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            value={settings.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="Enter your full name"
                            className="h-12 rounded-xl border border-input px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="Enter your email"
                            className="h-12 rounded-xl border border-input px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                            <Lock className="h-4 w-4 text-blue-600" />
                            New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={settings.password}
                              onChange={(e) => handleInputChange("password", e.target.value)}
                              placeholder="Enter new password"
                              className="h-12 rounded-xl border border-input px-4 pr-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Minimum 8 characters required
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-4 p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20">
                        <div className="text-center space-y-3">
                          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center">
                            <Image className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Profile Picture</h3>
                            <p className="text-sm text-muted-foreground">Upload a professional photo</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Platform Tab */}
                  <TabsContent value="platform" className="space-y-6 animate-in fade-in">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="toolName" className="text-sm font-semibold flex items-center gap-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          Platform Name
                        </Label>
                        <Input
                          id="toolName"
                          value={settings.toolName}
                          onChange={(e) => handleInputChange("toolName", e.target.value)}
                          placeholder="Enter your platform name"
                          className="h-12 rounded-xl border border-input px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Image className="h-4 w-4 text-blue-600" />
                          Platform Logo
                        </Label>

                        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-input bg-background">
                          <div className="flex-shrink-0">
                            <div className="relative group">
                              <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 overflow-hidden bg-white shadow-sm">
                                {logoPreview ? (
                                  <img src={logoPreview} alt="Platform logo" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-muted/20">
                                    <Building className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 space-y-3">
                            <div>
                              <input
                                id="toolLogo"
                                type="file"
                                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                                onChange={(e) => handleInputChange("toolLogo", e.target.files[0])}
                                className="sr-only"
                              />
                              <label
                                htmlFor="toolLogo"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/25"
                              >
                                <Upload className="h-4 w-4" />
                                Choose Logo File
                              </label>
                            </div>

                            {logoFile && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-medium">{logoFile.name}</span>
                              </div>
                            )}

                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>✓ Supports JPEG, PNG, SVG, WebP</p>
                              <p>✓ Maximum file size: 2MB</p>
                              <p>✓ Recommended: 256×256px square image</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={isUpdating || !superAdmin}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Settings...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Confirm Changes</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to update the SuperAdmin information? This action will immediately apply changes to your platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-11 rounded-xl border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpdate}
              disabled={isUpdating}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminUpdatePage;