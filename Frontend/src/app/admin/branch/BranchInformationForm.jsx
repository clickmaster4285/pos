"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BranchInformationForm = ({ register, errors, mode }) => {
   return (
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
   );
};

export default BranchInformationForm;