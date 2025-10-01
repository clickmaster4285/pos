'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, ChevronRight } from 'lucide-react';

export default function AddStockPicker({ open, onOpenChange, items, onPick }) {
  const [query, setQuery] = React.useState('');
  const [hoveredId, setHoveredId] = React.useState(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items || [];
    return (items || []).filter((it) => {
      const inVars =
        it.variants?.some((v) =>
          [v.variantName, v.sku]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q))
        ) || false;

      return (
        [it.itemName, it.itemType, it.vendor, it.location]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(q)) || inVars
      );
    });
  }, [items, query]);

  const activeItem =
    filtered.find((x) => x.id === hoveredId) ?? filtered[0] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[900px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Stock</DialogTitle>
        </DialogHeader>

        <div className="flex h-[70vh] min-h-[480px] w-full flex-col">
          {/* Search */}
          <div className="px-2 pt-2">
            <Command shouldFilter={false}>
              <div className="flex items-center gap-2 rounded-md border px-2">
                <Search className="h-4 w-4 opacity-70" />
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search inventory by name, SKU, variant, vendor…"
                />
              </div>
            </Command>
          </div>

          <Command shouldFilter={false} className="flex flex-1">
            <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
              {/* LEFT: inventory list */}
              <div className="border-r">
                <CommandList>
                  <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                    No items match “{query}”
                  </CommandEmpty>

                  <ScrollArea className="h-[calc(70vh-4rem)]">
                    <CommandGroup heading="Inventory">
                      {filtered.map((it) => {
                        const totalVariants = it.variants?.length || 0;
                        const totalQty =
                          it.variants?.reduce(
                            (sum, v) => sum + Number(v.quantity || 0),
                            0
                          ) || 0;

                        return (
                          <CommandItem
                            key={it.id}
                            value={it.itemName}
                            onMouseEnter={() => setHoveredId(it.id)}
                            onFocus={() => setHoveredId(it.id)}
                            onSelect={() => {
                              onPick?.({ item: it });
                              onOpenChange(false);
                            }}
                            className="group flex cursor-pointer items-center gap-3 py-3"
                          >
                            <Package className="h-4 w-4 opacity-70" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate font-medium">
                                  {it.itemName}
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {it.itemType ? (
                                  <Badge variant="secondary">
                                    {it.itemType}
                                  </Badge>
                                ) : null}
                                <span>
                                  {totalVariants} variant
                                  {totalVariants === 1 ? '' : 's'}
                                </span>
                                <span>•</span>
                                <span>Total qty: {totalQty}</span>
                                {it.vendor ? (
                                  <>
                                    <span>•</span>
                                    <span>Vendor: {it.vendor}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
              </div>

              {/* RIGHT: variants preview */}
              <div className="hidden min-h-0 flex-col md:flex">
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <div className="truncate text-sm font-semibold">
                    {activeItem?.itemName || 'Variants'}
                  </div>
                  {activeItem?.itemType ? (
                    <Badge variant="outline">{activeItem.itemType}</Badge>
                  ) : null}
                </div>

                <ScrollArea className="h-[calc(70vh-4rem)]">
                  {activeItem ? (
                    <div className="divide-y">
                      {activeItem.variants?.length ? (
                        activeItem.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              onPick?.({ item: activeItem, variant: v });
                              onOpenChange(false);
                            }}
                            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {v.variantName || '—'}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {v.sku ? (
                                  <Badge variant="secondary">
                                    SKU: {v.sku}
                                  </Badge>
                                ) : null}
                                <span>Qty: {Number(v.quantity ?? 0)}</span>
                                {typeof v.incomingQuantity === 'number' ? (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Incoming: {Number(v.incomingQuantity)}
                                    </span>
                                  </>
                                ) : null}
                                {typeof v.price === 'number' ? (
                                  <>
                                    <span>•</span>
                                    <span>Price: {v.price}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <ChevronRight className="mt-1 h-4 w-4 opacity-50" />
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-sm text-muted-foreground">
                          No variants for this item.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      Hover an item to preview its variants.
                    </div>
                  )}
                </ScrollArea>

                <CommandSeparator />
                <div className="px-4 py-2 text-xs text-muted-foreground">
                  Tip: Type to filter. Enter picks the highlighted row. Click a
                  variant to add stock directly to that variant.
                </div>
              </div>
            </div>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
}
