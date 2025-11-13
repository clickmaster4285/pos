"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUpdateSuperAdminInfoMutation } from "@/features/superAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Database,
  Download,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSelector } from "react-redux";

// Import the new Data Management Component
import DataManagementMenu from "@/components/DataBackups/DataManagementMenu";

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

  const [updateSuperAdminInfo, { isLoading: isUpdating, error: updateError }] =
    useUpdateSuperAdminInfoMutation();

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const user = useSelector((state) => state.auth.user);

  // Fetch super admin data
  const fetchSuperAdmin = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);

      try {
        if (user && user.role === "superAdmin") {
          setSuperAdmin(user);
          setSettings({
            name: user.name || "",
            email: user.email || "",
            password: "",
            toolName: user.toolName || "",
            toolLogo: user.toolLogo || null,
          });
          setLogoPreview(
            user.toolLogo ? `${API_URL}${user.toolLogo.replace(/\\/g, "/")}` : null
          );
          setLastUpdated(new Date());
        } else {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            cache: "no-cache",
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
              setLogoPreview(
                data.data.toolLogo
                  ? `${API_URL}${data.data.toolLogo.replace(/\\/g, "/")}`
                  : null
              );
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
        if (isRefresh) setIsRefreshing(false);
      }
    },
    [API_URL, user]
  );

  // Initial fetch
  useEffect(() => {
    fetchSuperAdmin();
  }, [fetchSuperAdmin]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSuperAdmin(true);
    }, 30000);
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
        setSuperAdmin(updatedUser);
        setLogoPreview(
          response.data.toolLogo
            ? `${API_URL}${response.data.toolLogo.replace(/\\/g, "/")}`
            : null
        );
        setSettings((prev) => ({ ...prev, password: "" }));
        setLogoFile(null);
        setLastUpdated(new Date());
        window.location.reload(true);
        setTimeout(() => fetchSuperAdmin(true), 1000);
      } else {
        setMessage({ type: "error", text: response.message || "Failed to update information" });
      }
    } catch (err) {
      console.error("Frontend error:", err);
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-3xl shadow-2xl">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Admin Settings
              </h1>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Manage your profile information and platform settings
              </p>
            </div>
          </div>
          
          {lastUpdated && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-2xl border border-border">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-3 py-3 px-6 rounded-2xl border border-border bg-card/50 hover:bg-card text-foreground shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar - User Info */}
          <Card className="xl:col-span-1 shadow-2xl border border-border bg-card/80 backdrop-blur-sm rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <Avatar className="h-28 w-28 border-4 border-card shadow-2xl mx-auto">
                    <AvatarImage src={logoPreview || null} alt={settings.name || "Super Admin"} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                      {getInitials(settings.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-2xl shadow-lg">
                    <Shield className="h-3 w-3 mr-2" />
                    Super Admin
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-foreground">
                    {settings.name || "Super Administrator"}
                  </h2>
                  <p className="text-muted-foreground break-all bg-muted/50 rounded-2xl p-3">
                    {settings.email || "admin@example.com"}
                  </p>
                </div>

                <div className="bg-muted/30 rounded-2xl p-6 space-y-4 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tool Name:</span>
                    <span className="font-semibold text-foreground">{settings.toolName || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="bg-success/20 text-success border-success/20 px-3 py-1 rounded-xl">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Settings Panel */}
          <div className="xl:col-span-3 space-y-8">
            <Card className="shadow-2xl border border-border bg-card/80 backdrop-blur-sm rounded-3xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  <Settings className="h-8 w-8 text-primary" />
                  Platform Configuration
                </CardTitle>
                <CardDescription className="text-lg">Update your personal information and platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                {message && (
                  <Alert
                    variant={message.type === "error" ? "destructive" : "default"}
                    className="mb-8 animate-in fade-in duration-300 border rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      {message.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <AlertDescription className="font-medium text-base">{message.text}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                  <TabsList className="grid w-full grid-cols-3 p-2 bg-muted/50 rounded-2xl border border-border">
                    <TabsTrigger value="profile" className="flex items-center gap-3 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300">
                      <User className="h-5 w-5" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="platform" className="flex items-center gap-3 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300">
                      <Building className="h-5 w-5" />
                      Platform
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="flex items-center gap-3 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300">
                      <Database className="h-5 w-5" />
                      Data Management
                    </TabsTrigger>
                  </TabsList>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsConfirmOpen(true);
                    }}
                  >
                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-8 animate-in fade-in">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="name" className="text-base font-semibold flex items-center gap-3">
                              <User className="h-5 w-5 text-primary" />
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              value={settings.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              placeholder="Enter your full name"
                              className="h-14 rounded-2xl border border-border bg-card px-5 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="email" className="text-base font-semibold flex items-center gap-3">
                              <Mail className="h-5 w-5 text-primary" />
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={settings.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              placeholder="Enter your email"
                              className="h-14 rounded-2xl border border-border bg-card px-5 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="password" className="text-base font-semibold flex items-center gap-3">
                              <Lock className="h-5 w-5 text-primary" />
                              New Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={settings.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                placeholder="Enter new password"
                                className="h-14 rounded-2xl border border-border bg-card px-5 pr-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-14 px-4 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-5 w-5 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Minimum 8 characters required
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-6 p-8 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5">
                          <div className="text-center space-y-4">
                            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                              <Image className="h-10 w-10 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground">Profile Picture</h3>
                              <p className="text-muted-foreground">Upload a professional photo</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Platform Tab */}
                    <TabsContent value="platform" className="space-y-8 animate-in fade-in">
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <Label htmlFor="toolName" className="text-base font-semibold flex items-center gap-3">
                            <Building className="h-5 w-5 text-primary" />
                            Platform Name
                          </Label>
                          <Input
                            id="toolName"
                            value={settings.toolName}
                            onChange={(e) => handleInputChange("toolName", e.target.value)}
                            placeholder="Enter your platform name"
                            className="h-14 rounded-2xl border border-border bg-card px-5 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                          />
                        </div>

                        <div className="space-y-6">
                          <Label className="text-base font-semibold flex items-center gap-3">
                            <Image className="h-5 w-5 text-primary" />
                            Platform Logo
                          </Label>

                          <div className="flex flex-col lg:flex-row items-center gap-8 p-8 rounded-3xl border border-border bg-card">
                            <div className="flex-shrink-0">
                              <div className="relative group">
                                <div className="h-32 w-32 rounded-3xl border-2 border-dashed border-primary/20 overflow-hidden bg-muted/30 shadow-lg">
                                  {logoPreview ? (
                                    <img src={logoPreview} alt="Platform logo" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-muted/20">
                                      <Building className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="absolute inset-0 bg-primary/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <Upload className="h-8 w-8 text-white" />
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 space-y-4">
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
                                  className="inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                                >
                                  <Upload className="h-5 w-5" />
                                  Choose Logo File
                                </label>
                              </div>

                              {logoFile && (
                                <div className="flex items-center gap-3 text-base text-success">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="font-medium">{logoFile.name}</span>
                                </div>
                              )}

                              <div className="space-y-2 text-sm text-muted-foreground">
                                <p>Supports JPEG, PNG, SVG, WebP</p>
                                <p>Maximum file size: 2MB</p>
                                <p>Recommended: 256×256px square image</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-8 border-t border-border mt-8">
                      <Button
                        type="submit"
                        disabled={isUpdating || !superAdmin}
                        className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-2xl hover:shadow-3xl transition-all duration-300"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Updating Settings...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-3 h-5 w-5" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Backup Tab */}
                  <TabsContent value="backup" className="animate-in fade-in">
                    <DataManagementMenu />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md border-0 shadow-3xl rounded-3xl bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold mt-4">Confirm Changes</DialogTitle>
            <DialogDescription className="text-center text-base">
              Are you sure you want to update the SuperAdmin information? This action will immediately apply changes to your platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-12 rounded-2xl border-2 border-border bg-card hover:bg-muted text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpdate}
              disabled={isUpdating}
              className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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