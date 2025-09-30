'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import React, { useState, useEffect } from 'react';
import { useBetaFeaturesMutation, useGetUserQuery } from '@/features/authApi';

export default function Page() {
  const { data: user, isLoading, isError, refetch } = useGetUserQuery();
  const [updateBeta, { isLoading: saving }] = useBetaFeaturesMutation();
  const [beta, setBeta] = useState(false);

  useEffect(() => {
    if (user?.data?.betaFeatures !== undefined) {
      setBeta(!!user.data.betaFeatures);
    } else if (user?.betaFeatures !== undefined) {
      setBeta(!!user.betaFeatures);
    }
  }, [user]);

  const handleToggle = async (checked) => {
    setBeta(checked); // optimistic update
    try {
      await updateBeta({ betaFeatures: checked }).unwrap();
      refetch();
    } catch (err) {
      console.error('Save failed:', err);
      setBeta(!checked); // revert on error
    }
  };

  if (isLoading) return <div className="p-4">Loading…</div>;
  if (isError) return <div className="p-4">Couldn’t load preferences.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Beta Features</h1>
      <Card>
        <CardContent>
          <div>
            {' '}
            <div className="space-y-2 flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">Enable Beta Features</h2>
                <p className="text-sm text-muted-foreground">
                  Fully functional features we're testing before release.
                </p>
              </div>
              <div>
                <Switch
                  id="beta-features"
                  checked={beta}
                  onCheckedChange={handleToggle}
                  disabled={saving}
                />
              </div>
            </div>
            <div>
              <div className="mb-3">
                <h2 className="text-sm font-medium">Bulk Upload</h2>
                <p className="text-sm text-muted-foreground">
                  Upload text or image based posts with a CSV file! Access via
                  Channel Settings on an individual channel.
                </p>
              </div>

              <div className="mb-3">
                <h2 className="text-sm font-medium">
                  Community - Manage your comments
                </h2>
                <p className="text-sm text-muted-foreground">
                  Easily manage the comments you get on Threads and Facebook
                  (more channels coming soon)
                </p>
              </div>

              <div className="">
                <h2 className="text-sm font-medium">
                  New Scheduling Actions design
                </h2>
                <p className="text-sm text-muted-foreground">
                  Clearer options for scheduling using your Buffer queue. Set a
                  default posting method if you prefer sharing immediately or at
                  specific times.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div>
            {' '}
            <div className="space-y-2 flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  About Our Beta Program
                </h2>
                <p className="text-sm text-muted-foreground">
                  Connect with other beta testers, share feedback, and get early
                  updates on new features.
                </p>
              </div>
            </div>
            <div>
              <div className="mb-3 space-y-2 flex justify-between items-center ">
                <div>
                  <h2 className="text-sm font-medium">Discord community</h2>
                  <p className="text-sm text-muted-foreground">
                    Join our Discord community to connect with the Buffer team
                    and other Buffer Beta users.
                  </p>
                </div>
                <div>
                  <Button>Join us on Discord</Button>
                </div>
              </div>

              {/* <div className="mb-3 space-y-2 flex justify-between items-center ">
                <div>
                  {' '}
                  <h2 className="text-sm font-medium">Our Roadmap</h2>
                  <p className="text-sm text-muted-foreground">
                    As you try out our Beta features, we'd love to hear your
                    feedback and get your help in shaping Buffer.
                  </p>
                </div>
                <div>
                  <Button variant={'secondary'}>Check Our Roadmap</Button>
                </div>
              </div> */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
