"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CreateBranchPage = () => {
   const router = useRouter();

   const [isActive, setIsActive] = useState(true);

   return (
      <div className="w-full space-y-6">
         {/* HEADER */}
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-3xl font-bold tracking-tight">Create New Branch</h2>
               <p className="text-sm text-muted-foreground">
                  Add a new branch to your company
               </p>
            </div>

            <Link href="/admin/branch">
               <Button variant="outline">Back to Branches</Button>
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
                     <Label>Branch Name</Label>
                     <Input placeholder="Downtown Branch" />
                  </div>

                  <div>
                     <Label>Branch Code</Label>
                     <Input placeholder="BR-001" />
                  </div>
               </div>

               <div>
                  <Label>Address</Label>
                  <Input placeholder="123 Market Street" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                     <Label>City</Label>
                     <Input placeholder="New York" />
                  </div>

                  <div>
                     <Label>Phone</Label>
                     <Input placeholder="+1 123 456 7890" />
                  </div>

                  <div>
                     <Label>Email</Label>
                     <Input placeholder="branch@example.com" />
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
                     <Label>Currency</Label>
                     <Select defaultValue="USD">
                        <SelectTrigger>
                           <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="USD">USD</SelectItem>
                           <SelectItem value="EUR">EUR</SelectItem>
                           <SelectItem value="GBP">GBP</SelectItem>
                           <SelectItem value="PKR">PKR</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  <div>
                     <Label>Tax Percentage (%)</Label>
                     <Input type="number" placeholder="10" />
                  </div>

                  <div>
                     <Label>Timezone</Label>
                     <Select defaultValue="EST">
                        <SelectTrigger>
                           <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="EST">EST</SelectItem>
                           <SelectItem value="PST">PST</SelectItem>
                           <SelectItem value="CST">CST</SelectItem>
                           <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Operational Settings */}
         <Card>
            <CardHeader>
               <CardTitle>Operational Settings</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <Label>Opening Hours</Label>
                     <Input placeholder="09:00 AM - 10:00 PM" />
                  </div>

                  <div className="flex items-center justify-between border rounded-lg p-3">
                     <div>
                        <Label>Branch Status</Label>
                        <p className="text-sm text-muted-foreground">
                           Enable / Disable Branch
                        </p>
                     </div>

                     <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
               </div>

               <div>
                  <Label>Receipt Header</Label>
                  <Textarea placeholder="Thank you for shopping with us!" />
               </div>

               <div>
                  <Label>Receipt Footer</Label>
                  <Textarea placeholder="Visit again — POS SaaS" />
               </div>

               <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => router.back()}>
                     Cancel
                  </Button>

                  <Button>Create Branch</Button>
               </div>
            </CardContent>
         </Card>
      </div>
   );
};

export default CreateBranchPage;

