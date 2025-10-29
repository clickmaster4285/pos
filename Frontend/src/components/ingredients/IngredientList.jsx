'use client';

import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Package } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

function IngredientListComponent({
  ingredients,
  onEdit,
  onDelete,
  handleToggle,
  pendingId,
  onOpenSheet,
  onAddStock,
}) {
  if (!ingredients?.length) {
    return <div className="text-center py-12 text-muted-foreground">No ingredients found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Cost/Unit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map((ing) => (
          <TableRow key={ing._id}>
            <TableCell className="font-medium">{ing.name}</TableCell>
            <TableCell className="font-mono">{ing.SKU}</TableCell>
            <TableCell>{ing.category}</TableCell>
            <TableCell>
              <span className={ing.currentStock === 0 ? 'text-red-600 font-medium' : ''}>
                {ing.currentStock} {ing.unit}
              </span>
            </TableCell>
            <TableCell>${ing.costPerUnit?.toFixed(2)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={ing.isActive}
                  onCheckedChange={() => handleToggle(ing)}
                  disabled={pendingId === ing._id}
                />
                <Badge variant={ing.isActive ? 'default' : 'secondary'}>
                  {ing.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => onOpenSheet(ing)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(ing)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onAddStock(ing)}>
                  <Package className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(ing)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const IngredientList = memo(IngredientListComponent);