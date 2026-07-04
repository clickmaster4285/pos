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
import { useDispatch } from "react-redux";
import { addToast } from "@/features/toastSlice";
import { useCreateBranchMutation, useUpdateBranchMutation, useGetBranchByIdQuery } from "@/features/branchesApi";
import { useGetAllStaffQuery } from "@/features/staffApi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BranchInformationForm from "./BranchInformationForm";
import ManagerManagement from "./ManagerManagement";

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
   managers: z.array(z.object({
      userId: z.string(),
      name: z.string(),
      role: z.enum(["manager", "assistant", "supervisor"]),
      department: z.string().optional(),
      email: z.string().email().optional(),
      assignedAt: z.string().datetime().optional(),
      assignedBy: z.string().optional(),
   })).optional().default([]),
});

const BranchForm = ({ branchId = null, mode = "create" }) => {
   const router = useRouter();
   const { user } = useSelector((state) => state.auth);
   const dispatch = useDispatch(); // Initialize dispatch

   // Helper function to show toast
   const showToast = (type, title, description, duration = 5000) => {
      dispatch(addToast({
         type,
         title,
         description,
         duration,
         bgColor: type === 'success' ? 'bg-green-50' : 'bg-red-50',
         textColor: type === 'success' ? 'text-green-800' : 'text-red-800',
         icon: type === 'success' ? 'check-circle' : 'alert-circle',
      }));
   };

   // API Mutations
   const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
   const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

   // Fetch branch data for edit mode
   const { data: branchData, isLoading: isLoadingBranch } = useGetBranchByIdQuery(
      branchId,
      { skip: !branchId || mode === "create" }
   );

   // Fetch all staff for manager selection
   const {
      data: staffData,
      isLoading: isLoadingStaff,
      error: staffError,
      refetch: refetchStaff
   } = useGetAllStaffQuery(undefined, {
      skip: !user?.companyId,
   });

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
         managers: [],
      },
   });

   // Local state for managers
   const [managers, setManagers] = useState([]);

   // Filter staff to only include staff from the same company
   const filteredStaff = staffData && Array.isArray(staffData)
      ? staffData.filter(staffMember =>
         staffMember.companyId === user?.companyId &&
         staffMember.role === "staff" &&
         staffMember.status?.isaccepted === "true" &&
         staffMember.isActive !== false
      )
      : [];

   // Handle staff fetch errors
   useEffect(() => {
      if (staffError) {
         console.error("Failed to fetch staff:", staffError);
         if (staffError.status === 401) {
            showToast('error', 'Authentication Error', 'Please login again to access staff data');
         } else {
            showToast('error', 'Error', 'Failed to load staff members. Please try again.');
         }
      }
   }, [staffError]);

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

         // Set managers from branch data
         if (branch.managers && Array.isArray(branch.managers)) {
            setManagers(branch.managers);
         }
      }
   }, [branchData, mode, reset]);

   const onSubmit = async (data) => {
      try {

         console.log('=== FRONTEND DEBUG ===');
         console.log('Submitting branch data:', data);
         console.log('Current user:', user);
         console.log('User permissions:', user?.permissions);
         console.log('createBranch permission:', user?.permissions?.createBranch);
         console.log('========================');

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
            managers: managers,
         };

         if (mode === "create") {
            await createBranch(payload).unwrap();
            showToast('success', 'Success', 'Branch created successfully');
            router.back();
         } else {
            const { branchId: bId, ...updatePayload } = payload;
            await updateBranch({
               id: branchId, 
               ...updatePayload 
            }).unwrap();
            showToast('success', 'Success', 'Branch updated successfully');
            router.back();
         }
      } catch (error) {
         console.error("Form submission error:", error);

         // Extract error message from backend response
         let errorMessage = error?.data?.message ||
            error?.data?.errors?.[0]?.msg ||
            `Failed to ${mode} branch`;

         // Check for specific plan-related errors
         if (error?.data?.message?.includes("Branch feature not available")) {
            errorMessage = "Your current plan doesn't include branch creation. Please upgrade your plan to create branches.";
         } else if (error?.data?.message?.includes("Plan limit reached")) {
            errorMessage = "You've reached the maximum number of branches allowed in your plan. Please upgrade to create more branches.";
         } else if (error?.data?.message?.includes("No active plan found")) {
            errorMessage = "No active subscription plan found. Please contact support or subscribe to a plan.";
         } else if (error.status === 403 && !errorMessage.includes("authorized")) {
            errorMessage = "Permission denied. You may not have the required plan features.";
         } else if (error.status === 500) {
            errorMessage = "Server error occurred. Please try again later or contact support.";
         }

         // Show error message using Redux toast
         showToast('error', 'Error', errorMessage);
         // console.error("Detailed error:", errorMessage);
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

            {/* Branch Information Form Component */}
            <BranchInformationForm
               register={register}
               errors={errors}
               watch={watch}
               setValue={setValue}
               mode={mode}
            />

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

            {/* Manager Management Component */}
            <ManagerManagement
               staffData={staffData}
               filteredStaff={filteredStaff}
               isLoadingStaff={isLoadingStaff}
               staffError={staffError}
               refetchStaff={refetchStaff}
               managers={managers}
               setManagers={setManagers}
               user={user}
               showToast={showToast} // Pass showToast to ManagerManagement
            />

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