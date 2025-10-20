'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

export function DeleteConfirmDialog({ open, onOpenChange, onConfirm, productName, isLoading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Product
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">{productName || 'this product'}</span>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            Delete Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}