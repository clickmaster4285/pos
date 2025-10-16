'use client';

import * as React from 'react';

export function SummaryCard({ title, value }) {
  return (
    <div className="border bg-card rounded-md  p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
