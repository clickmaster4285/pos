'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function AddIngredientStockModal({ isOpen, onClose, onSave, selectedIngredient }) {
  const [quantity, setQuantity] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;
    onSave([{ ingredientId: selectedIngredient._id, quantity: qty }]);
    setQuantity('');
  }, [quantity, selectedIngredient, onSave]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stock - {selectedIngredient?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quantity to Add</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter amount in ${selectedIngredient?.unit || 'units'}`}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Stock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}