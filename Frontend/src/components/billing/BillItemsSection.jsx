import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';

function BillItemsSection({
  currencySymbol,
  items,
  removeItem,
  searchRef,
  searchProduct,
  setSearchProduct,
  showSearchResults,
  setShowSearchResults,
  ordersLoading,
  isValidatingOrders,
  productsLoading,
  isValidatingProducts,
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
  updateQty,
}) {
  return (
    <Card className="bg-card border-border lg:col-span-2">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            Search orders or products and import them.
          </CardDescription>
        </div>
        <CreateNewOrderInBill
          onCreated={async (created) => {
            if (created?.items?.length) {
              if (!buyerTouched) {
                const inferred = extractBuyerFromOrder(created);
                if (inferred.name || inferred.phone) {
                  setBuyer({
                    name: created?.buyer?.name || inferred.name || '',
                    email: created?.buyer?.email || '',
                    phone: created?.buyer?.phone || inferred.phone || '',
                  });
                  setBuyerTouched(true);
                }
              }
              addOrderToBill(created);
              return;
            }
            try {
              const refreshed = await refetchOrders().unwrap();
              const list = Array.isArray(refreshed?.data)
                ? refreshed.data
                : Array.isArray(refreshed)
                ? refreshed
                : [];
              const id = String(created?._id || created?.id || '');
              const full = list.find((o) => String(o?._id) === id);

              if (full) {
                if (!buyerTouched) {
                  const inferred = extractBuyerFromOrder(full);
                  if (inferred.name || inferred.phone) {
                    setBuyer({
                      name: full?.buyer?.name || inferred.name || '',
                      email: full?.buyer?.email || '',
                      phone: full?.buyer?.phone || inferred.phone || '',
                    });
                    setBuyerTouched(true);
                  }
                }
                addOrderToBill(full);
              }
            } catch (e) {
              console.error('Refetch after create failed', e);
            }
          }}
        />
      </CardHeader>

      <CardContent>
        {/* Search input + dropdown */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search orders and products by Order No., Bill No. or Product name / SKU"
            value={searchProduct}
            onChange={(e) => {
              setSearchProduct(e.target.value);
              setShowSearchResults(true);
            }}
            className="pl-10"
            onFocus={() => setShowSearchResults(true)}
          />

          {showSearchResults && (
            <div className="absolute z-10 mt-2 w-full bg-background border border-border rounded-md shadow-lg max-h-72 overflow-y-auto">
              {/* Orders section */}
              <div className="px-3 py-2 text-[11px] font-semibold uppercase text-muted-foreground border-b bg-muted/30">
                Orders
              </div>
              {ordersLoading || isValidatingOrders ? (
                <div className="p-3 text-xs text-muted-foreground">
                  Loading orders…
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">
                  No matching orders
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className="px-4 py-2 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                    onMouseDown={() => addOrderToBill(order)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.orderNo || '(Order)'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customerName
                            ? `Customer: ${order.customerName} · `
                            : ''}
                          Items: {order.items?.length || 0} · Total:{' '}
                          {currencySymbol}
                          {Number(order.subTotal || 0).toFixed(2)} ·{' '}
                          {String(
                            order.paymentStatus || 'unpaid'
                          ).toUpperCase()}
                        </p>
                      </div>
                      <span className="text-[11px] rounded px-2 py-0.5 bg-muted text-muted-foreground shrink-0">
                        {(order.orderStatus || 'pending').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Products section */}
              <div className="px-3 py-2 text-[11px] font-semibold uppercase text-muted-foreground border-y bg-muted/30">
                Products
              </div>
              {productsLoading || isValidatingProducts ? (
                <div className="p-3 text-xs text-muted-foreground">
                  Loading products…
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">
                  No matching products
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="px-4 py-2 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                    onMouseDown={() => addProductToBill(product)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.productName || product.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.SKU || product.sku
                            ? `SKU: ${product.SKU || product.sku} · `
                            : ''}
                          Price: {currencySymbol}
                          {Number(
                            product.sellingPrice ?? product.price ?? 0
                          ).toFixed(2)}{' '}
                          · Stock:{' '}
                          {Number(product.quantity ?? product.stock ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Items table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No items added
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={`${item.productId || 'i'}-${index}`}>
                  <TableCell>{item.itemName}</TableCell>

                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {item.orderId
                        ? item.orderNo
                          ? `Order ${item.orderNo}`
                          : `Order ${String(item.orderId).slice(-6)}`
                        : 'Manual'}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    {item.orderId ? (
                      // Order-based line: qty fixed from order
                      Number(item.qty || 0)
                    ) : (
                      // Product/manual line: user can edit qty
                      <Input
                        type="number"
                        min={1}
                        className="w-20 text-right"
                        value={Number(item.qty || 1)}
                        onChange={(e) => {
                          const raw = Number(e.target.value || 1);
                          updateQty(index, raw);
                        }}
                      />
                    )}
                  </TableCell>

                  <TableCell>{currencySymbol}</TableCell>
                  <TableCell className="text-right">
                    {currencySymbol}
                    {Number(item.price).toFixed(2)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      aria-label={`Remove ${item.itemName}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

BillItemsSection.propTypes = {
  currencySymbol: PropTypes.string,
  items: PropTypes.array.isRequired,
  removeItem: PropTypes.func.isRequired,
  searchRef: PropTypes.object,
  searchProduct: PropTypes.string.isRequired,
  setSearchProduct: PropTypes.func.isRequired,
  showSearchResults: PropTypes.bool.isRequired,
  setShowSearchResults: PropTypes.func.isRequired,
  ordersLoading: PropTypes.bool,
  isValidatingOrders: PropTypes.bool,
  productsLoading: PropTypes.bool,
  isValidatingProducts: PropTypes.bool,
  filteredOrders: PropTypes.array.isRequired,
  filteredProducts: PropTypes.array.isRequired,
  addOrderToBill: PropTypes.func.isRequired,
  addProductToBill: PropTypes.func.isRequired,
  CreateNewOrderInBill: PropTypes.elementType.isRequired,
  extractBuyerFromOrder: PropTypes.func.isRequired,
  buyerTouched: PropTypes.bool.isRequired,
  setBuyerTouched: PropTypes.func.isRequired,
  setBuyer: PropTypes.func.isRequired,
  refetchOrders: PropTypes.func.isRequired,
  updateQty: PropTypes.func.isRequired,
};

export default BillItemsSection;
