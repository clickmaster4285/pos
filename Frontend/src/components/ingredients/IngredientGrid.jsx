'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Package } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

function IngredientGridComponent({
  ingredients,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
  onAddStock,
}) {
  if (!ingredients?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No ingredients found. Add your first ingredient!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {ingredients.map((ing) => (
        <Card key={ing._id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-sm truncate pr-2">{ing.name}</h3>
              <Badge variant={ing.isActive ? 'default' : 'secondary'}>
                {ing.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="text-xs space-y-1 text-muted-foreground">
              <p>SKU: <span className="font-mono">{ing.SKU}</span></p>
              <p>Category: {ing.category}</p>
              <p>Stock: <span className={ing.currentStock === 0 ? 'text-red-600' : ''}>
                {ing.currentStock} {ing.unit}
              </span></p>
              <p>Cost: ${ing.costPerUnit?.toFixed(2)}/{ing.unit}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Switch
                checked={ing.isActive}
                onCheckedChange={() => handleToggle(ing)}
                disabled={pendingId === ing._id}
              />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => onOpenSheet(ing)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onEdit(ing)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onAddStock(ing)}>
                  <Package className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(ing)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const IngredientGrid = memo(IngredientGridComponent);