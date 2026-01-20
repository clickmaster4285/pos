"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateBranchMutation, useUpdateBranchMutation, useGetBranchByIdQuery } from "@/features/branchesApi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Zod Schema for validation
const branchSchema = z.object({
   name: z.string().min(2, "Name must be at least 2 characters").max(100),
   branchId: z.string().min(3, "Branch ID must be at least 3 characters").max(20),
   address: z.object({
      street: z.string().optional(),
      city: z.string().min(1, "City is required"),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().default("Pakistan"),
   }),
   contact: z.object({
      phone: z.string().min(1, "Phone is required"),
      email: z.string().email("Invalid email").optional().or(z.literal("")),
   }),
   type: z.enum(["restaurant", "retail", "cafe", "warehouse"]).default("restaurant"),
   settings: z.object({
      taxRate: z.coerce.number().min(0).max(100).default(16),
      currency: z.string().default("PKR"),
   }).default({}),
   monthlyTarget: z.coerce.number().min(0).default(0),
   status: z.enum(["active", "inactive"]).default("active"),
});

const BranchForm = ({ branchId = null, mode = "create" }) => {
   const router = useRouter();
   const { user } = useSelector((state) => state.auth);

   // API Mutations
   const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
   const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

   // Fetch branch data for edit mode
   const { data: branchData, isLoading: isLoadingBranch } = useGetBranchByIdQuery(
      branchId,
      { skip: !branchId || mode === "create" }
   );

   const {
      register,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors },
   } = useForm({
      resolver: zodResolver(branchSchema),
      defaultValues: {
         name: "",
         branchId: "",
         address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "Pakistan",
         },
         contact: {
            phone: "",
            email: "",
         },
         type: "restaurant",
         settings: {
            taxRate: 16,
            currency: "PKR",
         },
         monthlyTarget: 0,
         status: "active",
      },
   });

   // Populate form when editing
   useEffect(() => {
      if (branchData?.data && mode === "edit") {
         const branch = branchData.data;
         reset({
            name: branch.name,
            branchId: branch.branchId,
            address: branch.address || {
               street: "",
               city: "",
               state: "",
               zipCode: "",
               country: "Pakistan",
            },
            contact: branch.contact || {
               phone: "",
               email: "",
            },
            type: branch.type || "restaurant",
            settings: branch.settings || {
               taxRate: 16,
               currency: "PKR",
            },
            monthlyTarget: branch.monthlyTarget || 0,
            status: branch.status || "active",
         });
      }
   }, [branchData, mode, reset]);

   const onSubmit = async (data) => {
      try {
         // Prepare the payload according to your backend expectations
         const payload = {
            name: data.name,
            branchId: data.branchId,
            address: {
               street: data.address.street || "",
               city: data.address.city,
               state: data.address.state || "",
               zipCode: data.address.zipCode || "",
               country: data.address.country || "Pakistan",
            },
            contact: {
               phone: data.contact.phone,
               email: data.contact.email || "",
            },
            type: data.type,
            settings: {
               taxRate: Number(data.settings.taxRate) || 16,
               currency: data.settings.currency || "PKR",
            },
            monthlyTarget: Number(data.monthlyTarget) || 0,
            status: data.status,
            companyId: user?.companyId,
         };

         console.log("Submitting payload:", payload);

         if (mode === "create") {
            await createBranch(payload).unwrap();
            toast.success("Branch created successfully");
            router.push("/admin/branch");
         } else {
            await updateBranch({
               id: branchId,
               ...payload
            }).unwrap();
            toast.success("Branch updated successfully");
            router.push("/admin/branch");
         }
      } catch (error) {
         console.error("Form submission error:", error);

         // Show error message
         const errorMessage = error?.data?.message ||
            error?.data?.errors?.[0]?.msg ||
            `Failed to ${mode} branch`;

         toast.error(errorMessage);
      }
   };

   const isLoading = isCreating || isUpdating;

   if (mode === "edit" && isLoadingBranch) {
      return (
         <div className="container mx-auto p-6 flex items-center justify-center min-h-100">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      );
   }

   return (
      <div className="container mx-auto p-6">
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                     {mode === "create" ? "Create New Branch" : "Edit Branch"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                     {mode === "create"
                        ? "Add a new branch to your company"
                        : "Update branch information"}
                  </p>
               </div>

               <Link href="/admin/branch">
                  <Button variant="outline">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Back to Branches
                  </Button>
               </Link>
            </div>

            {/* Branch Information */}
            <Card>
               <CardHeader>
                  <CardTitle>Branch Information</CardTitle>
               </CardHeader>

               <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="name">Branch Name *</Label>
                        <Input
                           id="name"
                           placeholder="Downtown Branch"
                           {...register("name")}
                        />
                        {errors.name && (
                           <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                        )}
                     </div>

                     <div>
                        <Label htmlFor="branchId">Branch ID *</Label>
                        <Input
                           id="branchId"
                           placeholder="BR-001"
                           {...register("branchId")}
                           disabled={mode === "edit"}
                        />
                        {errors.branchId && (
                           <p className="text-sm text-red-500 mt-1">{errors.branchId.message}</p>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="address.street">Street Address</Label>
                        <Input
                           id="address.street"
                           placeholder="123 Market Street"
                           {...register("address.street")}
                        />
                     </div>

                     <div>
                        <Label htmlFor="address.city">City *</Label>
                        <Input
                           id="address.city"
                           placeholder="Karachi"
                           {...register("address.city")}
                        />
                        {errors.address?.city && (
                           <p className="text-sm text-red-500 mt-1">{errors.address.city.message}</p>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <Label htmlFor="address.state">State</Label>
                        <Input
                           id="address.state"
                           placeholder="Sindh"
                           {...register("address.state")}
                        />
                     </div>

                     <div>
                        <Label htmlFor="address.zipCode">Zip Code</Label>
                        <Input
                           id="address.zipCode"
                           placeholder="75500"
                           {...register("address.zipCode")}
                        />
                     </div>

                     <div>
                        <Label htmlFor="address.country">Country</Label>
                        <Input
                           id="address.country"
                           defaultValue="Pakistan"
                           {...register("address.country")}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
               <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
               </CardHeader>

               <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="contact.phone">Phone Number *</Label>
                        <Input
                           id="contact.phone"
                           placeholder="+92 300 1234567"
                           {...register("contact.phone")}
                        />
                        {errors.contact?.phone && (
                           <p className="text-sm text-red-500 mt-1">{errors.contact.phone.message}</p>
                        )}
                     </div>

                     <div>
                        <Label htmlFor="contact.email">Email</Label>
                        <Input
                           id="contact.email"
                           type="email"
                           placeholder="branch@example.com"
                           {...register("contact.email")}
                        />
                        {errors.contact?.email && (
                           <p className="text-sm text-red-500 mt-1">{errors.contact.email.message}</p>
                        )}
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Business Settings */}
            <Card>
               <CardHeader>
                  <CardTitle>Business Settings</CardTitle>
               </CardHeader>

               <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <Label>Branch Type</Label>
                        <Select
                           value={watch("type")}
                           onValueChange={(value) => setValue("type", value)}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="restaurant">Restaurant</SelectItem>
                              <SelectItem value="retail">Retail Store</SelectItem>
                              <SelectItem value="cafe">Cafe</SelectItem>
                              <SelectItem value="warehouse">Warehouse</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div>
                        <Label htmlFor="settings.currency">Currency</Label>
                        <Select
                           value={watch("settings.currency")}
                           onValueChange={(value) => setValue("settings.currency", value)}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="PKR">PKR (₨)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div>
                        <Label htmlFor="settings.taxRate">Tax Rate (%)</Label>
                        <Input
                           id="settings.taxRate"
                           type="number"
                           min="0"
                           max="100"
                           step="0.1"
                           defaultValue={16}
                           {...register("settings.taxRate", {
                              valueAsNumber: true,
                           })}
                        />
                     </div>
                  </div>

                  <div>
                     <Label htmlFor="monthlyTarget">Monthly Target (Optional)</Label>
                     <Input
                        id="monthlyTarget"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        defaultValue={0}
                        {...register("monthlyTarget", {
                           valueAsNumber: true,
                        })}
                     />
                  </div>
               </CardContent>
            </Card>

            {/* Operational Settings */}
            <Card>
               <CardHeader>
                  <CardTitle>Operational Settings</CardTitle>
               </CardHeader>

               <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border rounded-lg p-4">
                     <div>
                        <Label htmlFor="status">Branch Status</Label>
                        <p className="text-sm text-muted-foreground">
                           Enable / Disable Branch
                        </p>
                     </div>

                     <Switch
                        checked={watch("status") === "active"}
                        onCheckedChange={(checked) =>
                           setValue("status", checked ? "active" : "inactive")
                        }
                        id="status"
                     />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                     >
                        Cancel
                     </Button>

                     <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "create" ? "Create Branch" : "Update Branch"}
                     </Button>
                  </div>
               </CardContent>
            </Card>
         </form>
      </div>
   );
};

export default BranchForm;