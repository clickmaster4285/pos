// src/app/admin/branch/[id]/edit/page.jsx
"use client";

import { useParams } from "next/navigation";
import BranchForm from "@/components/branch/BranchForm";
import { Skeleton } from "@/components/ui/skeleton";

const EditBranchPage = () => {
   const params = useParams();
   const branchId = params.id;

   if (!branchId) {
      return (
         <div className="w-full space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96" />
         </div>
      );
   }

   return <BranchForm branchId={branchId} mode="edit" />;
};

export default EditBranchPage;