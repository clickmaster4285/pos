'use client';

import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }) {
  const variant =
    status === 'Completed'
      ? 'active'
      : status === 'In Progress'
      ? 'pending'
      : status === 'Pending'
      ? 'reject'
      : 'reject'; // Cancelled

  return <Badge variant={variant}>{status}</Badge>;
}


  // <div className="col-span-1">
  //             <StatusBadge status={o.status} />
//           </div>  
  //import { StatusBadge } from './status-badge';