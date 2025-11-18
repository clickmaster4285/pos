// Modified: BillItemsSection.jsx (added check for existing order, danger effect on attempt to add second order)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, ShoppingCart } from 'lucide-react';

const highlightText = (text, query) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <span key={i} className="bg-yellow-300 font-bold">{part}</span>
      : part
  );
};

export default function BillItemsSection({
  currencySymbol,
  items,
  removeItem,
  updateQty,
  searchRef,
  searchProduct,
  setSearchProduct,
  showSearchResults,
  setShowSearchResults,
  ordersLoading,
  productsLoading,
  filteredOrders,
  filteredProducts,
  addOrderToBill,
  addProductToBill,
  CreateNewOrderInBill,
  extractBuyerFromOrder,
  buyerTouched,
  setBuyerTouched,
  setBuyer,
  refetchOrders,
}) {
  const hasExistingOrder = items.some(item => !!item.orderId);

  const handleAddOrder = (e, order) => {
    if (hasExistingOrder) {
      e.currentTarget.style.backgroundColor = '#fee2e2';
      e.currentTarget.style.border = '1px solid #ef4444';
      setTimeout(() => {
        e.currentTarget.style.backgroundColor = '';
        e.currentTarget.style.border = '';
      }, 1000);
      return;
    }
    addOrderToBill(order);
  };

  return (
    <Card className="lg:col-span-2 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bill Items</CardTitle>
          <CardDescription>Type to search orders & products</CardDescription>
        </div>
        <CreateNewOrderInBill onCreated={(o) => {
          addOrderToBill(o);
          refetchOrders();
        }} />
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search Order No, Customer, Product, SKU..."
            value={searchProduct}
            onChange={(e) => {
              setSearchProduct(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="pl-10"
          />

          {showSearchResults && (filteredOrders.length > 0 || filteredProducts.length > 0 || searchProduct) && (
            <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
              {ordersLoading || productsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {filteredOrders.length > 0 && (
                    <div className="border-b">
                      <div className="px-4 py-2 bg-muted text-xs font-bold uppercase">Orders</div>
                      {filteredOrders.map(order => (
                        <div key={order._id} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                          onMouseDown={(e) => handleAddOrder(e, order)}>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">#{order.orderNo}</div>
                              <div className="text-xs text-muted-foreground">
                                {highlightText(order.customerName || 'Walk-in', searchProduct)} · {order.items?.length} items
                              </div>
                            </div>
                            <Badge variant="secondary">{currencySymbol}{Number(order.subTotal || 0).toFixed(2)}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredProducts.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-muted text-xs font-bold uppercase">Products</div>
                      {filteredProducts.map(p => (
                        <div key={p._id} className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                          onMouseDown={() => addProductToBill(p)}>
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{highlightText(p.productName, searchProduct)}</div>
                              <div className="text-xs text-muted-foreground">Stock: {p.quantity}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{currencySymbol}{Number(p.sellingPrice || p.price).toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchProduct && filteredOrders.length === 0 && filteredProducts.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Search className="mx-auto h-10 w-10 mb-3 opacity-30" />
                      <p>No results found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <ShoppingCart className="w-16 h-16 opacity-30" />
                      <div>
                        <p className="text-lg font-medium">No items yet</p>
                        <p className="text-sm">Start typing above to add items</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.orderNo ? `Order #${item.orderNo}` : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.orderId ? item.qty : (
                        <Input
                          type="number"
                          min="1"
                          className="w-20 text-right"
                          value={item.qty}
                          onChange={(e) => updateQty(i, Number(e.target.value) || 1)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">{currencySymbol}{Number(item.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">{currencySymbol}{Number(item.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}