// src/app/admin/branch/[id]/page.jsx
"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
   useGetBranchByIdQuery,
   useGetBranchDashboardQuery
} from "@/features/branchesApi";
import Link from "next/link";
import {
   ArrowLeft,
   MapPin,
   Phone,
   Mail,
   Building2,
   Users,
   Calendar,
   Globe,
   DollarSign,
   Target,
   Edit,
   Trash2
} from "lucide-react";

const BranchDetailPage = () => {
   const params = useParams();
   const branchId = params.id;
console.log("Branch ID:", branchId);
   const {
      data: branchData,
      isLoading: isLoadingBranch,
      isError: isBranchError
   } = useGetBranchByIdQuery(branchId);

   const {
      data: dashboardData,
      isLoading: isLoadingDashboard
   } = useGetBranchDashboardQuery(branchId);

   const branch = branchData?.data;
   const dashboard = dashboardData?.data;

   if (isLoadingBranch || isLoadingDashboard) {
      return (
         <div className="w-full space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Skeleton className="h-64" />
               <Skeleton className="h-64" />
            </div>
         </div>
      );
   }

   if (isBranchError || !branch) {
      return (
         <Alert variant="destructive" className="my-6">
            <AlertDescription>
               Failed to load branch details. Branch may not exist or you don't have permission.
            </AlertDescription>
         </Alert>
      );
   }

   const getStatusBadge = (status) => {
      const variants = {
         active: "bg-green-100 text-green-800",
         inactive: "bg-yellow-100 text-yellow-800",
         closed: "bg-red-100 text-red-800",
         maintenance: "bg-blue-100 text-blue-800",
      };

      return (
         <Badge className={`${variants[status] || 'bg-gray-100'} capitalize`}>
            {status}
         </Badge>
      );
   };

   return (
      <div className="w-full space-y-6">
         {/* HEADER */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <Link href="/admin/branch">
                  <Button variant="ghost" size="icon">
                     <ArrowLeft className="h-4 w-4" />
                  </Button>
               </Link>
               <div>
                  <h2 className="text-3xl font-bold tracking-tight">{branch.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                     <code className="bg-muted px-2 py-1 rounded text-sm">
                        {branch.branchCode}
                     </code>
                     {getStatusBadge(branch.status)}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <Link href={`/admin/branch/${branchId}/edit`}>
                  <Button variant="outline">
                     <Edit className="mr-2 h-4 w-4" />
                     Edit
                  </Button>
               </Link>
            </div>
         </div>

         {/* DASHBOARD CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
                  <Target className="text-muted-foreground h-5 w-5" />
               </CardHeader>
               <CardContent>
                  <div className="text-3xl font-bold">
                     {dashboard?.targets?.monthlyTarget?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     {branch.settings?.currency || 'PKR'}
                  </p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Managers</CardTitle>
                  <Users className="text-muted-foreground h-5 w-5" />
               </CardHeader>
               <CardContent>
                  <div className="text-3xl font-bold">
                     {dashboard?.management?.totalManagers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     Branch managers
                  </p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Tax Rate</CardTitle>
                  <DollarSign className="text-muted-foreground h-5 w-5" />
               </CardHeader>
               <CardContent>
                  <div className="text-3xl font-bold">
                     {branch.settings?.taxRate || 16}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     Applied tax rate
                  </p>
               </CardContent>
            </Card>
         </div>

         {/* DETAILS */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branch Information */}
            <Card>
               <CardHeader>
                  <CardTitle>Branch Information</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                           <p className="text-sm text-muted-foreground">Type</p>
                           <p className="capitalize">{branch.type}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                           <p className="text-sm text-muted-foreground">Opened</p>
                           <p>{new Date(branch.openingDate).toLocaleDateString()}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                           <p className="text-sm text-muted-foreground">Currency</p>
                           <p>{branch.settings?.currency || 'PKR'}</p>
                        </div>
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
                  <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                           <p className="text-sm text-muted-foreground">Address</p>
                           <p>{branch.fullAddress || `${branch.address?.street}, ${branch.address?.city}`}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                           <p className="text-sm text-muted-foreground">Phone</p>
                           <p>{branch.contact?.phone || 'N/A'}</p>
                        </div>
                     </div>

                     {branch.contact?.email && (
                        <div className="flex items-center gap-3">
                           <Mail className="h-4 w-4 text-muted-foreground" />
                           <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p>{branch.contact.email}</p>
                           </div>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>

            {/* Managers List */}
            <Card className="lg:col-span-2">
               <CardHeader>
                  <div className="flex items-center justify-between">
                     <CardTitle>Managers</CardTitle>
                     <Button variant="outline" size="sm">
                        Add Manager
                     </Button>
                  </div>
               </CardHeader>
               <CardContent>
                  {branch.managers?.length > 0 ? (
                     <div className="space-y-3">
                        {branch.managers.map((manager, index) => (
                           <div key={manager.userId || index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                 <Users className="h-4 w-4 text-muted-foreground" />
                                 <div>
                                    <p className="font-medium">{manager.userId}</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                       {manager.role} • Assigned {new Date(manager.assignedAt).toLocaleDateString()}
                                    </p>
                                 </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No managers assigned to this branch</p>
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
   );
};

export default BranchDetailPage;