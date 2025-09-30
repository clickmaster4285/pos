'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import React from 'react';
import { toast, Toaster } from 'sonner';
import { useGetReferralLinkQuery } from '@/features/referralApi';
import { useGetUserQuery } from '@/features/authApi';

export default function Page() {
  const { data: link, isLoading, error } = useGetReferralLinkQuery();
  const { data: user } = useGetUserQuery();
  const referralCode = user?.referralCode ?? '';

  const handleCopyLink = async () => {
    try {
      if (!link) throw new Error('No link');
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied');
    } catch (e) {
      toast.error('Could not copy. Long-press or use the copy icon.');
    }
  };

  const handleCopyCode = async () => {
    try {
      if (!referralCode) throw new Error('referralCode');
      await navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied');
    } catch (e) {
      toast.error('Could not copy. Long-press or use the copy icon.');
    }
  };
  const handleShare = () => {
    if (navigator.share && link) {
      navigator
        .share({
          title: 'Join me on Buffer',
          text: 'Check out this awesome tool!',
          url: link,
        })
        .catch(() => {});
    } else if (link) {
      handleCopy();
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        {' '}
        <h1 className="text-2xl font-bold mb-4">Refer a Friend</h1>
        <p className="text-sm text-muted-foreground">
          Enjoying Buffer? Your friends will too! Share Buffer to help them grow
          an audience with a totally free account. You’ll also support Buffer’s
          growth, allowing us to continue improving the service.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Referral Link */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Referral Link
            </h2>
            <div className="flex gap-2">
              <Input value={link || ''} readOnly className="flex-1" />
              <Button variant="secondary" onClick={handleCopyLink}>
                Copy
              </Button>
              <Button onClick={handleShare}>Share</Button>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Referral Code
            </h2>
            <div className="flex gap-2">
              <Input
                value={referralCode || ''}
                readOnly
                className="w-full max-w-[120px] sm:max-w-[140px] md:max-w-[180px] "
              />
              <Button
                variant="secondary"
                onClick={() => handleCopyCode(referralCode)}
              >
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="space-y-2 ">
            <div>
              <h2 className="text-sm font-medium mb-3">How it works:</h2>
              <div>
                <div className="flex mb-2  gap-2">
                  <Badge variant={'catB'} className={'rounded-full'}>
                    1
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Find the unique referral link above for your organization.
                  </p>
                </div>

                <div className="flex mb-2 gap-2">
                  <Badge variant={'catB'} className={'rounded-full'}>
                    2
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Share your link publicly or with someone who’d enjoy using
                    Buffer.
                  </p>
                </div>

                <div className="flex mb-2  gap-2">
                  <Badge variant={'catB'} className={'rounded-full'}>
                    3
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Your friend signs up for their free Buffer account.
                  </p>
                </div>

                <div className="flex mb-2  gap-2">
                  <Badge variant={'catB'} className={'rounded-full'}>
                    4
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    You and your friend can grow on social and beyond.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Toaster richColors position="top-right" />
    </div>
  );
}
