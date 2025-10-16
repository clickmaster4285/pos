'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

const ChangePlanDialog = dynamic(
  () => import('@/components/settings/ChangePlanDialog'),
  { ssr: false }
);

export default function Page() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 mt-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 md:gap-14">
        {/* Left: Content */}
        <div className="space-y-5 pl-0 lg:pl-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Upgrade to Create Channel Groups
            </h1>
            <p className="text-sm text-muted-foreground">
              Group your channels based on how you plan your social content to
              make planning faster than ever. Get all this, plus:
            </p>
          </div>

          <ul className="space-y-3">
            {[
              'Schedule up to 2000 posts at a time',
              'Advanced publishing, planning and engaging features',
              'In-depth social analytics and reposting',
            ].map((text) => (
              <li
                key={text}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p>{text}</p>
              </li>
            ))}
          </ul>

          <div className="pt-1">
            <Button onClick={() => setOpen(true)}>Set Upgrade Options</Button>
          </div>
        </div>

        {/* Right: Image */}
        <div className="w-full max-w-[420px] lg:justify-self-end">
          <div className="p-5 rounded-xl bg-orange-100/70 border border-orange-200">
            <img
              src="https://buffer-publish.s3.us-east-1.amazonaws.com/images/channel-groups-upgrade-path.png"
              alt="Channel groups upgrade preview"
              loading="lazy"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Dialog root lives here so children like DialogPortal have a parent */}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Your ChangePlanDialog should ONLY render DialogContent/DialogHeader/etc.
            Do NOT create another <Dialog> inside the component. */}
        <ChangePlanDialog onClose={() => setOpen(false)} />
      </Dialog>
    </div>
  );
}
