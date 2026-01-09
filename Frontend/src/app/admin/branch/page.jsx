"use client";

import React, { useState } from "react";
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

import Link from "next/link";
import { MoreHorizontal, Plus, MapPin, Building2, Users, Search } from "lucide-react";

const BranchPage = () => {
   const [filter, setFilter] = useState("all");
   const [search, setSearch] = useState("");

   const branches = [
      {
         id: "BR-001",
         name: "Downtown Branch",
         city: "New York",
         phone: "+1 123 456 7890",
         status: "Active",
         staff: 12,
         created: "Jan 10, 2026",
      },
      {
         id: "BR-002",
         name: "Central Mall Branch",
         city: "Los Angeles",
         phone: "+1 222 111 4444",
         status: "Active",
         staff: 8,
         created: "Feb 02, 2026",
      },
      {
         id: "BR-003",
         name: "Airport Branch",
         city: "Chicago",
         phone: "+1 555 999 0000",
         status: "Inactive",
         staff: 0,
         created: "Feb 20, 2026",
      },
   ];

   const filteredBranches = branches.filter((b) => {
      const matchesFilter =
         filter === "all" ? true : b.status.toLowerCase() === filter.toLowerCase();
      const matchesSearch =
         b.name.toLowerCase().includes(search.toLowerCase()) ||
         b.city.toLowerCase().includes(search.toLowerCase()) ||
         b.id.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
   });

   return (
      <div className="w-full space-y-6">
         {/* PAGE HEADER */}
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-3xl font-bold tracking-tight">Branches</h2>
               <p className="text-sm text-muted-foreground">
                  Manage all company branches from one place
               </p>
            </div>

            <Link href="/admin/branch/create">
               <Button className="flex items-center gap-2">
                  <Plus size={18} />
                  Add New Branch
               </Button>
            </Link>
         </div>

         {/* DASHBOARD CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Total Branches</CardTitle>
                  <Building2 className="text-muted-foreground" />
               </CardHeader>
               <CardContent className="text-3xl font-bold">
                  {branches.length}
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Active Branches</CardTitle>
                  <MapPin className="text-green-600" />
               </CardHeader>
               <CardContent className="text-3xl font-bold">
                  {branches.filter((b) => b.status === "Active").length}
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Total Staff</CardTitle>
                  <Users className="text-blue-600" />
               </CardHeader>
               <CardContent className="text-3xl font-bold">
                  {branches.reduce((acc, b) => acc + b.staff, 0)}
               </CardContent>
            </Card>
         </div>

         {/* FILTER BAR */}
         <Card>
            <CardContent className="py-4 flex flex-col md:flex-row gap-3 justify-between items-center">
               {/* Search */}
               <div className="flex items-center gap-2 w-full md:w-1/2">
                  <Search className="text-muted-foreground" size={18} />
                  <Input
                     placeholder="Search branch by name / city / ID..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                  />
               </div>

               {/* Status Filter */}
               <div className="flex items-center gap-2 w-full md:w-1/4">
                  <Select onValueChange={setFilter} defaultValue="all">
                     <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </CardContent>
         </Card>

         {/* BRANCH TABLE */}
         <Card>
            <CardHeader>
               <CardTitle>Branch List</CardTitle>
            </CardHeader>

            <CardContent>
               <Table>
                  <TableCaption>Branch management overview</TableCaption>

                  <TableHeader>
                     <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Branch ID</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                  </TableHeader>

                  <TableBody>
                     {filteredBranches.map((branch) => (
                        <TableRow key={branch.id}>
                           <TableCell className="font-medium">{branch.name}</TableCell>
                           <TableCell>{branch.city}</TableCell>
                           <TableCell>{branch.id}</TableCell>
                           <TableCell>{branch.phone}</TableCell>

                           <TableCell>
                              <Badge
                                 variant={
                                    branch.status === "Active" ? "default" : "destructive"
                                 }
                              >
                                 {branch.status}
                              </Badge>
                           </TableCell>

                           <TableCell>{branch.staff}</TableCell>
                           <TableCell>{branch.created}</TableCell>

                           <TableCell className="text-right">
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                       <MoreHorizontal size={18} />
                                    </Button>
                                 </DropdownMenuTrigger>

                                 <DropdownMenuContent align="right">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Edit Branch</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                       {branch.status === "Active"
                                          ? "Disable Branch"
                                          : "Enable Branch"}
                                    </DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </TableCell>
                        </TableRow>
                     ))}

                     {filteredBranches.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                              No branches found...
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
   );
};

export default BranchPage;
