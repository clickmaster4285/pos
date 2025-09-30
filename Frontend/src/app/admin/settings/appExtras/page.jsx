'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import React from 'react';

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Apps &amp; Extras</h1>
      <Card>
        <CardContent>
          <div className="space-y-2 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Browser Extension</h2>
              <p className="text-sm text-muted-foreground">
                Our browser extension lets you share content as you browse the
                web.
              </p>
            </div>
            <div>
              <Button>Install Extentions</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div className="space-y-2 gap-5 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Mobile Apps</h2>
              <p className="text-sm text-muted-foreground">
                Share content and manage your Buffer account on the go with our
                mobile apps.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button>Andriod App</Button>
              <Button variant={'secondary'}>iOS App</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Connected Apps</h2>
            <p className="text-sm text-muted-foreground">
              Get the most out of Buffer and share from your mobile, news
              reader, blog or anywhere!
              <span className="ml-1 text-primary hover:text-primary/80">Get More Apps →</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
