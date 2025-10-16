'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WarehouseTable({ items, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border ">
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Part Number
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Part Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Category
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Location
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
              Quantity
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
              Unit Price
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
              Total Value
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border hover:bg-secondary/20 transition-colors"
            >
              <td className="px-6 py-4 text-sm font-mono font-medium">
                {item.partNumber}
              </td>
              <td className="px-6 py-4 text-sm text-foreground">
                {item.partName}
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {item.category}
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {item.location}
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                <span
                  className={
                    item.quantity < 50
                      ? 'text-destructive font-bold'
                      : 'text-foreground'
                  }
                >
                  {item.quantity}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-sm text-foreground">
                ${item.unitPrice.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-primary">
                ${(item.quantity * item.unitPrice).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No parts found. Try adjusting your search.
          </p>
        </div>
      )}
    </div>
  );
}
