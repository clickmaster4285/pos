'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'sonner'; // 👈 import both

export default function Page() {
  const orgRef = useRef(null);

  const handleSave = () => {
    const value = orgRef.current?.value?.trim() || '';
    // save logic here
    toast.success('Changes saved!', {
      description: 'Your organization settings have been updated.',
    });
  };

  return (
    <div className="max-w-4xl mt-2 mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">General</h1>
      </header>

      <Card>
        <CardContent>
          <div className="mb-4 border-b pb-4">
            <h2 className="text-lg font-semibold mb-1">Creation Date</h2>
            <p className="text-sm text-gray-600">August 18, 2024</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-1">Organization Name</h2>

            <div className="flex items-center gap-3 w-full">
              {' '}
              {/* stretch row */}
              <Input
                ref={orgRef}
                id="organization"
                type="text"
                placeholder="My Organizations"
                defaultValue="My Organizations"
                className="flex-1 min-w-0" /* let it grow */
              />
              <Button onClick={handleSave} className="shrink-0">
                Save Changes
              </Button>
              {/* or <Button className="ml-auto">Save Changes</Button> to push right */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toaster here — no layout changes needed */}
      <Toaster richColors position="top-right" />
    </div>
  );
}
