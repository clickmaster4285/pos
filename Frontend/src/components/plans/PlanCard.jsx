// components/PlanCard.jsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { capFirst, getTypeColor } from './utils';
import {
  Edit,
  MoreVertical,
  Trash2,
  Users,
  Boxes,
  Store,
  Calendar,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

export function PlanCard({ plan, onEdit, onDelete }) {
  return (
    <Card className="relative hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl text-balance">
              {capFirst(plan.name)}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={'pending'}>{plan.validateDays}/Days</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Plan
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Plan
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{plan.name}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <CardDescription className="text-pretty">
          <Label className={'mb-2'}>Description</Label>
          {plan.description}
        </CardDescription>

        {/* {plan.description.length > 150
          ? plan.description.slice(0, 150) + '...'
          : plan.description} */}

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">
            <Label className={'mb-2'}>Price</Label>${plan.price}
            <span className="text-sm font-normal text-muted-foreground"></span>
          </div>
        </div>
        <Label className={'mb-2'}>Usage Limits</Label>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-secondary-foreground" />
            <span>{plan.maxUsers} staff</span>
          </div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-secondary-foreground" />
            <span>{plan.maxVehicles} inventory</span>
          </div>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-secondary-foreground" />
            <span>{plan.maxVendors ?? 0} vendors</span>
          </div>
        </div>

        <FeaturesBadges features={plan.features} />

        <div className="mt-auto pt-2 border-t text-xs text-muted-foreground flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>Updated {plan.updatedAt}</span>
        </div>
      </CardContent>
    </Card>
  );
}
function FeaturesBadges({ features = [] }) {
  if (!Array.isArray(features) || features.length === 0) {
    return <span className="text-xs text-muted-foreground">No features</span>;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Features:</h4>
      <div className="flex flex-wrap gap-1">
        {features.slice(0, 6).map((f, i) => (
          <Badge
            key={i}
            variant="outline"
            className="text-xs font-normal px-2 py-0.5"
          >
            {f}
          </Badge>
        ))}
        {features.length > 6 && (
          <span className="text-xs text-muted-foreground">
            +{features.length - 6} more
          </span>
        )}
      </div>
    </div>
  );
}
