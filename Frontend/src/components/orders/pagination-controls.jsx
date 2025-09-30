'use client';

import { Button } from '@/components/ui/button';

export function PaginationControls({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {'Showing '}
        <span className="font-medium">{(page - 1) * pageSize + 1}</span>
        {'–'}
        <span className="font-medium">{Math.min(page * pageSize, total)}</span>
        {' of '}
        <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          aria-label="First page"
        >
          {'<<'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          {'<'}
        </Button>
        <span className="text-sm">
          {'Page '}
          <strong>{page}</strong>
          {' / '}
          {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          {'>'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="Last page"
        >
          {'>>'}
        </Button>
      </div>
    </div>
  );
}
