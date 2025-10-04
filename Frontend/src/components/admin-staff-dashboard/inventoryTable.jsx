'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetInventoryQuery } from '@/features/inventoryApi';
import { Package, AlertTriangle, TrendingDown } from 'lucide-react';

export function InventoryTable() {
  const router = useRouter();
  const { data: inventory, isLoading, error, refetch } = useGetInventoryQuery();

  // Transform API data for the table
  const tableData = React.useMemo(() => {
    if (!inventory) return [];

    return inventory
      .flatMap(
        (item) =>
          item.variants?.map((variant) => ({
            id: variant._id,
            sku: variant.sku,
            name: `${item.itemName} - ${variant.variantName}`,
            qty: variant.quantity,
            min: variant.lowStockThreshold,
            location: item.location,
            isLowStock: variant.quantity <= variant.lowStockThreshold,
            itemName: item.itemName,
            variantName: variant.variantName,
          })) || []
      )
      .sort((a, b) => a.qty - b.qty); // Sort by quantity low → high
  }, [inventory]);

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory Levels</CardTitle>
          <Button variant="outline" disabled>
            Manage
          </Button>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Loading inventory...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory Levels</CardTitle>
          <Button variant="outline" onClick={refetch}>
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-destructive">
            Failed to load inventory
          </div>
        </CardContent>
      </Card>
    );
  }

  const lowStockItems = tableData.filter((item) => item.isLowStock);

  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            Inventory Levels
          </CardTitle>
          {lowStockItems.length > 0 && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}{' '}
              need attention
            </p>
          )}
        </div>
        <Button
          variant="outline"
          className="border-primary/40 text-primary"
          onClick={() => router.push('/admin/inventory')}
        >
          Manage
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {tableData.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b ">
                <tr className="text-muted-foreground">
                  <th className="py-3 px-4 text-left font-medium">SKU</th>
                  <th className="py-3 px-4 text-left font-medium">Item</th>
                  <th className="py-3 px-4 text-left font-medium">Qty</th>
                  <th className="py-3 px-4 text-left font-medium">Min</th>
                  <th className="py-3 px-4 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tableData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs">{item.sku}</td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="truncate" title={item.name}>
                        {item.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'font-medium',
                          item.isLowStock && 'text-destructive font-semibold'
                        )}
                      >
                        {item.qty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {item.min}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                          <TrendingDown className="h-3 w-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
