'use client';

import React, { useContext, useEffect, useState } from 'react';
import { Mail, CheckCircle2, XCircle, MailPlus, CheckCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AuthContext } from '@/components/auth/SecureAuthProvider';

import {
  useInitiateEmailChangeMutation,
  useVerifyEmailChangeMutation,
} from '@/features/CompanyApi';

export default function EmailChangeSection({ onEmailUpdated, company }) {
  // prefer company email; fallback to authed user email; else empty
  const { user, setUser } = useContext(AuthContext) || {};
  const companyEmail = company?.companyInfo?.companyEmail || '';
  const authedEmail = user?.email || '';
  const currentEmailSource = companyEmail || authedEmail || '';

  // Inline toast
  const [toast, setToast] = useState({ type: '', message: '' });

  // Form + OTP dialog
  const [emailForm, setEmailForm] = useState({
    currentEmail: currentEmailSource,
    newEmail: '',
    confirmEmail: '',
  });
  const [emailOtpOpen, setEmailOtpOpen] = useState(false);
  const [emailCode, setEmailCode] = useState('');

  const [initiateEmailChange, { isLoading: sendingEmailCode }] =
    useInitiateEmailChangeMutation();
  const [verifyEmailChange, { isLoading: verifyingEmailCode }] =
    useVerifyEmailChangeMutation();

  // keep current email in sync if company/auth changes
  useEffect(() => {
    setEmailForm((f) => ({ ...f, currentEmail: currentEmailSource }));
  }, [currentEmailSource]);

  const handleSendCode = async (e) => {
    e.preventDefault();

    const { currentEmail, newEmail, confirmEmail } = emailForm;

    if (!currentEmail || !newEmail || !confirmEmail) {
      return setToast({ type: 'error', message: 'Please fill all fields.' });
    }
    if (newEmail !== confirmEmail) {
      return setToast({
        type: 'error',
        message: "New and confirm email don't match.",
      });
    }
    if (newEmail === currentEmail) {
      return setToast({
        type: 'error',
        message: 'New email must be different.',
      });
    }

    try {
      const res = await initiateEmailChange({
        currentEmail,
        newEmail,
      }).unwrap();

      setToast({
        type: 'success',
        message:
          res?.message || 'Verification code sent to your current email.',
      });
      setEmailOtpOpen(true);
    } catch (err) {
      const msg =
        err?.data?.message || err?.error || 'Failed to send verification code.';
      setToast({ type: 'error', message: msg });
    }
  };

  // inside handleVerify
  const handleVerify = async () => {
    if (!emailCode) {
      return setToast({ type: 'error', message: 'Enter the 6-digit code.' });
    }

    try {
      // ✅ send currentEmail along with the code
      const res = await verifyEmailChange({
        code: emailCode,
        currentEmail: emailForm.currentEmail,
      }).unwrap();

      // server may return updated email as data.email or data.newEmail (your choice)
      const newEmailFromServer =
        res?.data?.email || res?.data?.newEmail || emailForm.newEmail;

      if (typeof setUser === 'function' && newEmailFromServer) {
        setUser((u) => ({ ...u, email: newEmailFromServer }));
      }
      if (typeof onEmailUpdated === 'function' && newEmailFromServer) {
        onEmailUpdated(newEmailFromServer);
      }

      setEmailForm({
        currentEmail: newEmailFromServer,
        newEmail: '',
        confirmEmail: '',
      });
      setEmailCode('');
      setEmailOtpOpen(false);

      setToast({
        type: 'success',
        message: res?.message || 'Email updated successfully.',
      });
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.error ||
        'Verification failed. Please check the code.';
      setToast({ type: 'error', message: msg });
      setEmailCode('');
    }
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className=" flex items-center gap-2">
        <h2 className="text-lg font-medium">Change Company Email</h2>
      </div>

      {/* Inline toast */}
      {toast.message ? (
        <div
          className={`mb-2 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-700'
              : 'border-red-500/30 bg-red-500/10 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ type: '', message: '' })}
            className="ml-auto text-xs underline decoration-dotted"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSendCode} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="flex gap-2 items-center mb-1">
              <div className="rounded-lg bg-primary/10 text-primary p-2">
                <Mail className="h-4 w-4" />
              </div>
              <Label>Current Email</Label>
            </div>
            <Input
              value={emailForm.currentEmail}
              onChange={(e) =>
                setEmailForm((f) => ({ ...f, currentEmail: e.target.value }))
              }
              type="email"
              placeholder="current@email.com"
              className="mt-1"
              // Lock if we have a known current email from company/auth
              readOnly={!!currentEmailSource}
            />
          </div>

          <div>
            <div className="flex gap-2 items-center mb-1">
              <div className="rounded-lg bg-primary/10 text-primary p-2">
                <MailPlus className="h-4 w-4" />
              </div>
              <Label>New Email</Label>
            </div>
            <Input
              value={emailForm.newEmail}
              onChange={(e) =>
                setEmailForm((f) => ({ ...f, newEmail: e.target.value }))
              }
              type="email"
              placeholder="new@email.com"
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex gap-2 items-center mb-1">
              <div className="rounded-lg bg-primary/10 text-primary p-2">
                <CheckCheck className="h-4 w-4" />
              </div>
              <Label>Confirm New Email</Label>
            </div>
            <Input
              value={emailForm.confirmEmail}
              onChange={(e) =>
                setEmailForm((f) => ({ ...f, confirmEmail: e.target.value }))
              }
              type="email"
              placeholder="new@email.com"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={sendingEmailCode}>
            {sendingEmailCode ? 'Sending…' : 'Send Code'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setEmailForm({
                currentEmail: currentEmailSource,
                newEmail: '',
                confirmEmail: '',
              })
            }
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Email OTP Dialog */}
      <Dialog open={emailOtpOpen} onOpenChange={setEmailOtpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Email Change</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to{' '}
              <span className="font-medium">{emailForm.currentEmail}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label>Code</Label>
            <Input
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setEmailOtpOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={verifyingEmailCode}>
              {verifyingEmailCode ? 'Verifying…' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
