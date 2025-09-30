'use client';

// ===============================
// File: src/app/settings/profile/page.jsx
// ===============================
import React from 'react';
import { Toaster } from 'sonner';
import { useGetUserQuery } from '@/features/authApi';
import VerifyEmailBanner from '@/components/settings/profile/VerifyEmailBanner';
import ProfileCard from '@/components/settings/profile/ProfileCard';
import TwoFACard from '@/components/settings/profile/TwoFACard';
import AccountDeletionCard from '@/components/settings/profile/AccountDeletionCard';

export default function ProfilePage() {
  const { data: user, isLoading, isError, refetch } = useGetUserQuery();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-2">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="h-24 w-full bg-muted rounded" />
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto  mt-2 space-y-3">
        <p className="text-sm text-red-600">Couldn’t load your profile.</p>
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 mt-2 space-y-6">
      <header className="text-2xl font-bold">Profile</header>

      {!user?.isEmailVerified && <VerifyEmailBanner />}

      <ProfileCard user={user} onUpdated={refetch} />

      {!user?.twoFactorAuth?.isEnabled && <TwoFACard onUpdated={refetch} />}

      <AccountDeletionCard />

      <Toaster richColors position="top-center" />
    </div>
  );
}
