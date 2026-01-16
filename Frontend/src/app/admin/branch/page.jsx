// src/app/admin/branch/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
   Table,
   TableBody,
   TableCaption,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
   useGetCompanyBranchesQuery,
   useDeleteBranchMutation,
   useUpdateBranchMutation,
   useLazyGetCompanyBranchesQuery
} from "@/features/branchesApi";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
   MoreHorizontal,
   Plus,
   MapPin,
   Building2,
   Users,
   Search,
   Edit,
   Eye,
   Trash2,
   RefreshCw,
   Filter
} from "lucide-react";

const BranchPage = () => {
   const { user } = useSelector((state) => state.auth);
   const companyId = user?.companyId;

   const [filter, setFilter] = useState("all");
   const [search, setSearch] = useState("");
   const [page, setPage] = useState(1);
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const limit = 10;

   // API Queries
   const {
      data: branchesData,
      isLoading,
      isError,
      refetch
   } = useGetCompanyBranchesQuery({
      companyId,
      page,
      limit,
      status: filter !== "all" ? filter : undefined,
      search: debouncedSearch || undefined,
      sortBy: "createdAt",
      sortOrder: "desc"
   }, {
      skip: !companyId,
      refetchOnMountOrArgChange: true
   });

   const [deleteBranch, { isLoading: isDeleting }] = useDeleteBranchMutation();
   const [updateBranch] = useUpdateBranchMutation();

   // Debounce search
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(search);
         setPage(1); // Reset to first page on new search
      }, 500);

      return () => clearTimeout(timer);
   }, [search]);

   const handleDeleteBranch = async (branchId, branchName) => {
      if (!window.confirm(`Are you sure you want to delete "${branchName}"?`)) {
         return;
      }

      try {
         await deleteBranch({
            id: branchId,
            reason: "Deleted by admin"
         }).unwrap();

         toast({
            title: "Success",
            description: `Branch "${branchName}" deleted successfully`,
            variant: "default",
         });
      } catch (error) {
         toast({
            title: "Error",
            description: error?.data?.message || "Failed to delete branch",
            variant: "destructive",
         });
      }
   };

   const handleToggleStatus = async (branch) => {
      const newStatus = branch.status === 'active' ? 'inactive' : 'active';

      try {
         await updateBranch({
            id: branch.branchId || branch._id,
            status: newStatus
         }).unwrap();

         toast({
            title: "Success",
            description: `Branch status updated to ${newStatus}`,
            variant: "default",
         });
      } catch (error) {
         toast({
            title: "Error",
            description: error?.data?.message || "Failed to update status",
            variant: "destructive",
         });
      }
   };

   const branches = branchesData?.data || [];
   const pagination = branchesData?.pagination || {};
   const totalBranches = pagination.total || 0;
   const totalPages = pagination.totalPages || 1;

   const stats = {
      total: totalBranches,
      active: branches.filter(b => b.status === 'active').length,
      staff: branches.reduce((acc, b) => acc + (b.managers?.length || 0), 0),
   };

   const getStatusBadge = (status) => {
      const variants = {
         active: "bg-green-100 text-green-800 hover:bg-green-100",
         inactive: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
         closed: "bg-red-100 text-red-800 hover:bg-red-100",
         maintenance: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      };

      return (
         <Badge className={`${variants[status] || 'bg-gray-100'} capitalize`}>
            {status}
         </Badge>
      );
   };

   if (isLoading && page === 1) {
      return (
         <div className="w-full space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
               ))}
            </div>
            <Skeleton className="h-96" />
         </div>
      );
   }

   if (isError) {
      return (
         <Alert variant="destructive">
            <AlertDescription>
               Failed to load branches. Please try again.
            </AlertDescription>
            <Button onClick={refetch} className="mt-2">
               Retry
            </Button>
         </Alert>
      );
   }

   return (
      <div className="w-full space-y-6">
         {/* PAGE HEADER */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
               <h2 className="text-3xl font-bold tracking-tight">Branches</h2>
               <p className="text-sm text-muted-foreground">
                  Manage all company branches from one place
               </p>
            </div>

            <div className="flex items-center gap-2">
               <Button variant="outline" onClick={refetch} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
               </Button>

               <Link href="/admin/branch/create">
                  <Button className="flex items-center gap-2">
                     <Plus size={18} />
                     Add New Branch
                  </Button>
               </Link>
            </div>
         </div>

         {/* DASHBOARD CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
                  <Building2 className="text-muted-foreground h-5 w-5" />
               </CardHeader>
               <CardContent>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                     Across all locations
                  </p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
                  <MapPin className="text-green-600 h-5 w-5" />
               </CardHeader>
               <CardContent>
                  <div className="text-3xl font-bold">{stats.active}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                     Currently operational
                  </p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
                  <Users className="text-blue-600 h-5 w-5" />
               </CardHeader>
               <CardContent>
                  <div className="text-3xl font-bold">{stats.staff}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                     Managers across branches
                  </p>
               </CardContent>
            </Card>
         </div>

         {/* FILTER BAR */}
         <Card>
            <CardContent className="py-4">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="flex items-center gap-2 w-full md:w-1/2">
                     <Search className="text-muted-foreground h-4 w-4" />
                     <Input
                        placeholder="Search branch by name / city / code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1"
                     />
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                     <Filter className="text-muted-foreground h-4 w-4" />
                     <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-full md:w-45">
                           <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Status</SelectItem>
                           <SelectItem value="active">Active</SelectItem>
                           <SelectItem value="inactive">Inactive</SelectItem>
                           <SelectItem value="closed">Closed</SelectItem>
                           <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* BRANCH TABLE */}
         <Card>
            <CardHeader>
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Branch List</CardTitle>
                  <div className="text-sm text-muted-foreground">
                     Showing {branches.length} of {totalBranches} branches
                  </div>
               </div>
            </CardHeader>

            <CardContent>
               <div className="rounded-md border">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Name</TableHead>
                           <TableHead>Location</TableHead>
                           <TableHead>Code</TableHead>
                           <TableHead>Contact</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Managers</TableHead>
                           <TableHead>Created</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                     </TableHeader>

                     <TableBody>
                        {isLoading && page > 1 ? (
                           // Skeleton rows for pagination loading
                           [...Array(limit)].map((_, i) => (
                              <TableRow key={i}>
                                 {[...Array(8)].map((_, j) => (
                                    <TableCell key={j}>
                                       <Skeleton className="h-4 w-full" />
                                    </TableCell>
                                 ))}
                              </TableRow>
                           ))
                        ) : branches.length > 0 ? (
                           branches.map((branch) => (
                              <TableRow key={branch.branchId || branch._id}>
                                 <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                       <Building2 className="h-4 w-4 text-muted-foreground" />
                                       {branch.name}
                                    </div>
                                 </TableCell>

                                 <TableCell>
                                    <div className="flex flex-col">
                                       <span>{branch.address?.city || 'N/A'}</span>
                                       <span className="text-xs text-muted-foreground">
                                          {branch.address?.country || 'Pakistan'}
                                       </span>
                                    </div>
                                 </TableCell>

                                 <TableCell>
                                    <code className="bg-muted px-2 py-1 rounded text-sm">
                                       {branch.branchCode || 'N/A'}
                                    </code>
                                 </TableCell>

                                 <TableCell>
                                    <div className="flex flex-col">
                                       <span>{branch.contact?.phone || 'N/A'}</span>
                                       {branch.contact?.email && (
                                          <span className="text-xs text-muted-foreground">
                                             {branch.contact.email}
                                          </span>
                                       )}
                                    </div>
                                 </TableCell>

                                 <TableCell>{getStatusBadge(branch.status)}</TableCell>

                                 <TableCell>
                                    <div className="flex items-center gap-1">
                                       <Users className="h-4 w-4 text-muted-foreground" />
                                       <span>{branch.managers?.length || 0}</span>
                                    </div>
                                 </TableCell>

                                 <TableCell>
                                    {new Date(branch.createdAt).toLocaleDateString()}
                                 </TableCell>

                                 <TableCell className="text-right">
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                             <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                       </DropdownMenuTrigger>

                                       <DropdownMenuContent align="end" className="w-48">
                                          <Link href={`/admin/branch/${branch._id}`}>
                                             <DropdownMenuItem>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                             </DropdownMenuItem>
                                          </Link>

                                          <Link href={`/admin/branch/${branch._id}/edit`}>
                                             <DropdownMenuItem>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Branch
                                             </DropdownMenuItem>
                                          </Link>

                                          <DropdownMenuItem
                                             onClick={() => handleToggleStatus(branch)}
                                             disabled={branch.status === 'closed'}
                                          >
                                             {branch.status === 'active' ? 'Disable' : 'Enable'} Branch
                                          </DropdownMenuItem>

                                          <DropdownMenuItem
                                             className="text-red-600"
                                             onClick={() => handleDeleteBranch(
                                                branch.branchId || branch._id,
                                                branch.name
                                             )}
                                             disabled={isDeleting}
                                          >
                                             <Trash2 className="mr-2 h-4 w-4" />
                                             Delete Branch
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </TableCell>
                              </TableRow>
                           ))
                        ) : (
                           <TableRow>
                              <TableCell colSpan={8} className="text-center py-12">
                                 <div className="flex flex-col items-center gap-2">
                                    <Building2 className="h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground">No branches found</p>
                                    <p className="text-sm text-muted-foreground">
                                       {search || filter !== 'all'
                                          ? 'Try changing your search or filter'
                                          : 'Create your first branch to get started'}
                                    </p>
                                    {!search && filter === 'all' && (
                                       <Link href="/admin/branch/create">
                                          <Button className="mt-2">
                                             <Plus className="mr-2 h-4 w-4" />
                                             Create Branch
                                          </Button>
                                       </Link>
                                    )}
                                 </div>
                              </TableCell>
                           </TableRow>
                        )}
                     </TableBody>
                  </Table>
               </div>

               {/* PAGINATION */}
               {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                     <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                     </div>
                     <div className="flex items-center gap-2">
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                        >
                           Previous
                        </Button>
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                           disabled={page === totalPages || isLoading}
                        >
                           Next
                        </Button>
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
   );
};

export default BranchPage;