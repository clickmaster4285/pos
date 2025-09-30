'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GalleryVerticalEnd } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Skeleton shown while the grid lazily loads
function ChannelPickerSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-lg border border-border animate-pulse bg-muted/40"
        />
      ))}
    </div>
  );
}

// Lazy load the grid content
const ChannelPickerContent = dynamic(
  () => import('@/components/settings/ChannelPickerContent'),
  { ssr: false, loading: () => <ChannelPickerSkeleton /> }
);

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-4 mt-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Channels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tags are visible to everyone in your organization.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Connect Channel</Button>
      </div>

      {/* Plan notice */}
      <div className="flex items-start gap-3 rounded-md bg-primary/10 p-4">
        <GalleryVerticalEnd className="w-5 h-5 mt-0.5 text-primary" />
        <div className="space-y-1">
          <p className="font-semibold">Get to know your plan</p>
          <p className="text-sm text-muted-foreground">
            You are on the Free plan and can connect up to 3 channels. 1 of your
            channels is locked.
          </p>
        </div>
      </div>

      {/* Status */}
      <p className="text-sm text-muted-foreground">1/3 channels connected</p>

      {/* Locked Channels */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Locked Channels</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <GalleryVerticalEnd className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold leading-none">New Page</h3>
                  <p className="text-sm text-muted-foreground">Start Page</p>
                </div>
              </div>
              <Button variant="secondary">Publish to Connect</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Connect Channel Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl h-[650px] flex flex-col">
          {' '}
          {/* Reduced width and added height with flex column */}
          <DialogHeader className={'justify-center items-center border-b pb-5'}>
            <DialogTitle className={'font-bold mt-3'}>
              Connect a New Channel
            </DialogTitle>
            <DialogDescription className="text-center">
              Choose a platform to continue. You can configure details after
              selection.
            </DialogDescription>
          </DialogHeader>
          {/* Lazy-loaded grid */}
          <div className="flex-1 overflow-hidden">
            {' '}
            {/* Added container for proper scrolling */}
            <ChannelPickerContent
              onSelect={(platformId) => {
                // Handle selection: route, open another step, or toast
                // e.g., router.push(`/connect/${platformId}`)
                setOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
