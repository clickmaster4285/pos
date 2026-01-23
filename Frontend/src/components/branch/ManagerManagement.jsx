// ManagerManagement.jsx - Update to use showToast prop
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, X } from "lucide-react";

const ManagerManagement = ({
   staffData,
   filteredStaff,
   isLoadingStaff,
   staffError,
   refetchStaff,
   managers,
   setManagers,
   user,
   showToast // Add this prop
}) => {
   // Local state for manager selection
   const [selectedManager, setSelectedManager] = useState("");
   const [managerRole, setManagerRole] = useState("manager");

   // Add manager to the list
   const handleAddManager = () => {
      if (!selectedManager) {
         showToast('error', 'Error', 'Please select a staff member');
         return;
      }

      const selectedStaff = filteredStaff.find(staff => staff.userId === selectedManager);
      if (!selectedStaff) {
         showToast('error', 'Error', 'Selected staff member not found');
         return;
      }

      // Check if manager is already added
      if (managers.some(m => m.userId === selectedManager)) {
         showToast('error', 'Error', 'Staff member is already added as a manager');
         return;
      }

      const newManager = {
         userId: selectedStaff.userId,
         name: selectedStaff.name,
         role: managerRole,
         department: selectedStaff.department,
         email: selectedStaff.email,
         assignedAt: new Date().toISOString(),
         assignedBy: user?.userId,
      };

      setManagers(prev => [...prev, newManager]);
      setSelectedManager("");
      setManagerRole("manager");
      showToast('success', 'Success', 'Manager added successfully');
   };

   // Remove manager from the list
   const handleRemoveManager = (userId) => {
      setManagers(prev => prev.filter(m => m.userId !== userId));
      showToast('success', 'Success', 'Manager removed successfully');
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Branch Managers</CardTitle>
            <p className="text-sm text-muted-foreground">
               Assign managers to this branch
            </p>
         </CardHeader>

         <CardContent className="space-y-4">
            {/* Manager Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <Label htmlFor="manager-select">Select Staff Member</Label>
                  <Select
                     value={selectedManager}
                     onValueChange={setSelectedManager}
                     disabled={isLoadingStaff || staffError}
                  >
                     <SelectTrigger id="manager-select">
                        <SelectValue placeholder={
                           isLoadingStaff ? "Loading staff..." :
                              staffError ? "Failed to load staff" :
                                 "Select a staff member"
                        } />
                     </SelectTrigger>
                     <SelectContent>
                        {isLoadingStaff ? (
                           <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                 <Loader2 className="h-4 w-4 animate-spin" />
                                 Loading staff...
                              </div>
                           </SelectItem>
                        ) : staffError ? (
                           <div className="p-2 text-center">
                              <p className="text-sm text-red-500">Failed to load staff</p>
                              <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => refetchStaff()}
                                 className="mt-2"
                              >
                                 Retry
                              </Button>
                           </div>
                        ) : filteredStaff.length > 0 ? (
                           filteredStaff.map((staffMember) => (
                              <SelectItem key={staffMember.userId} value={staffMember.userId}>
                                 {staffMember.name} ({staffMember.subRole}) - {staffMember.department || "No Department"}
                              </SelectItem>
                           ))
                        ) : (
                           <SelectItem value="no-staff" disabled>
                              No staff members available
                           </SelectItem>
                        )}
                     </SelectContent>
                  </Select>
               </div>

               <div>
                  <Label htmlFor="manager-role">Role</Label>
                  <Select
                     value={managerRole}
                     onValueChange={setManagerRole}
                  >
                     <SelectTrigger id="manager-role">
                        <SelectValue placeholder="Select role" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex items-end">
                  <Button
                     type="button"
                     onClick={handleAddManager}
                     disabled={!selectedManager || isLoadingStaff || staffError}
                     className="w-full"
                  >
                     <UserPlus className="mr-2 h-4 w-4" />
                     Add Manager
                  </Button>
               </div>
            </div>

            {/* Managers List */}
            {managers.length > 0 && (
               <div className="space-y-3 mt-4">
                  <Label>Assigned Managers ({managers.length})</Label>
                  <div className="space-y-2">
                     {managers.map((manager) => (
                        <div
                           key={manager.userId}
                           className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                           <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                 <span className="text-sm font-medium">
                                    {manager.name?.charAt(0).toUpperCase()}
                                 </span>
                              </div>
                              <div>
                                 <p className="font-medium">{manager.name}</p>
                                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="capitalize">{manager.role}</span>
                                    <span>•</span>
                                    <span>{manager.department || "No Department"}</span>
                                    <span>•</span>
                                    <span>{manager.userId}</span>
                                 </div>
                              </div>
                           </div>
                           <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveManager(manager.userId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                              <X className="h-4 w-4" />
                           </Button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {managers.length === 0 && (
               <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <UserPlus className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No managers assigned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                     Add managers using the form above
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
};

export default ManagerManagement;