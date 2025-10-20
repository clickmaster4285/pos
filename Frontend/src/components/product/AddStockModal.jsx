'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export function AddStockModal({ isOpen, onClose, onSave, products, selectedProduct, isLoading }) {
  const [stockData, setStockData] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (selectedProduct) {
      setStockData([{ productId: selectedProduct.id, productName: selectedProduct.productName, quantity: '' }]);
      setSelectedProductId('');
      setQuantity('');
    } else {
      setStockData([]);
      setSelectedProductId('');
      setQuantity('');
    }
  }, [selectedProduct, isOpen]);

  const addProductStock = () => {
    if (selectedProductId && quantity && Number(quantity) > 0) {
      const product = products.find((p) => p._id === selectedProductId);
      if (product && !stockData.some((item) => item.productId === selectedProductId)) {
        setStockData([...stockData, {
          productId: selectedProductId,
          productName: product.productName,
          quantity: Number(quantity),
        }]);
        setSelectedProductId('');
        setQuantity('');
      }
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    setStockData((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Number(newQuantity) || 0 } : item
      )
    );
  };

  const removeProduct = (productId) => {
    setStockData((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stockData.length > 0) {
      onSave(stockData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            Add Stock
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mb-3">
            Add stock quantities for one or more products.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!selectedProduct && (
            <div className="space-y-2">
              <Label className="text-foreground">Select Product</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantity"
                  min="1"
                  className="border-border focus:ring"
                />
                <Button
                  type="button"
                  onClick={addProductStock}
                  disabled={!selectedProductId || !quantity || Number(quantity) <= 0}
                  className="gap-2"
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {stockData.length > 0 && (
            <div className="space-y-2">
              <Label className="text-foreground">Selected Products</Label>
              {stockData.map((item) => (
                <div key={item.productId} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{item.productName}</span>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, e.target.value)}
                    placeholder="Quantity"
                    min="1"
                    className="w-24 border-border focus:ring"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProduct(item.productId)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedProduct && (
            <div className="space-y-2">
              <Label className="text-foreground">Quantity for {selectedProduct.productName}</Label>
              <Input
                type="number"
                value={stockData[0]?.quantity || ''}
                onChange={(e) => updateQuantity(selectedProduct.id, e.target.value)}
                placeholder="Enter quantity"
                min="1"
                className="border-border focus:ring"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || stockData.length === 0 || stockData.some((item) => !item.quantity || item.quantity <= 0)}
              className="gap-2"
            >
              {isLoading ? 'Saving...' : 'Save Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}