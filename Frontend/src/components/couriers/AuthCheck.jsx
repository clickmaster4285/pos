'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export function FeedbackModal({
  open,
  onOpenChange,
  title,
  description,
  variant = 'success',
}) {
  const isSuccess = variant === 'success';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <DialogTitle
            className={isSuccess ? 'text-green-700' : 'text-red-700'}
          >
            {title}
          </DialogTitle>
        </DialogHeader>
        {description ? (
          <p className="text-sm mt-3 justify-center flex text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
