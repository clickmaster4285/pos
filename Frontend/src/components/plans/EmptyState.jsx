// components/EmptyState.jsx
import { Car } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground">
        <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No plans found</h3>
        <p>Try adjusting your search or filters, or create a new plan.</p>
      </div>
    </div>
  );
}
